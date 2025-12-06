import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET - Buscar todos os cursos
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool()
    const request = pool.request()

    const query = `
      SELECT 
        CUR_ID,
        CUR_DESC,
        CUR_ATIVO
      FROM CURSO
      WHERE CUR_ATIVO = 1
      ORDER BY CUR_DESC
    `

    const result = await request.query(query)

    return NextResponse.json({
      ok: true,
      cursos: result.recordset
    })
  } catch (err) {
    console.error('Erro ao buscar cursos:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

// POST - Criar novo curso
export async function POST(req: NextRequest) {
  try {
    const { descricao } = await req.json()

    if (!descricao || descricao.trim() === '') {
      return NextResponse.json(
        { ok: false, error: 'Descrição do curso é obrigatória.' },
        { status: 400 }
      )
    }

    const pool = await getPool()
    const request = pool.request()

    // Verifica se já existe um curso com essa descrição
    request.input('CUR_DESC', descricao.trim())
    const checkQuery = `
      SELECT CUR_ID FROM CURSO WHERE CUR_DESC = @CUR_DESC
    `
    const checkResult = await request.query(checkQuery)

    if (checkResult.recordset.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Já existe um curso com esta descrição.' },
        { status: 409 }
      )
    }

    // Insere o novo curso
    const insertQuery = `
      INSERT INTO CURSO (CUR_DESC, CUR_ATIVO)
      OUTPUT INSERTED.CUR_ID, INSERTED.CUR_DESC, INSERTED.CUR_ATIVO
      VALUES (@CUR_DESC, 1)
    `
    const insertResult = await request.query(insertQuery)

    return NextResponse.json({
      ok: true,
      curso: insertResult.recordset[0],
      message: 'Curso criado com sucesso!'
    })
  } catch (err) {
    console.error('Erro ao criar curso:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

// PUT - Atualizar curso existente
export async function PUT(req: NextRequest) {
  try {
    const { id, descricao, ativo } = await req.json()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID do curso é obrigatório.' },
        { status: 400 }
      )
    }

    if (!descricao || descricao.trim() === '') {
      return NextResponse.json(
        { ok: false, error: 'Descrição do curso é obrigatória.' },
        { status: 400 }
      )
    }

    const pool = await getPool()
    const request = pool.request()

    request.input('CUR_ID', id)
    request.input('CUR_DESC', descricao.trim())
    request.input('CUR_ATIVO', ativo !== undefined ? (ativo ? 1 : 0) : 1)

    const updateQuery = `
      UPDATE CURSO
      SET CUR_DESC = @CUR_DESC,
          CUR_ATIVO = @CUR_ATIVO
      OUTPUT INSERTED.CUR_ID, INSERTED.CUR_DESC, INSERTED.CUR_ATIVO
      WHERE CUR_ID = @CUR_ID
    `

    const result = await request.query(updateQuery)

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Curso não encontrado.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      curso: result.recordset[0],
      message: 'Curso atualizado com sucesso!'
    })
  } catch (err) {
    console.error('Erro ao atualizar curso:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

// DELETE - Desativar curso (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID do curso é obrigatório.' },
        { status: 400 }
      )
    }

    const pool = await getPool()
    const request = pool.request()

    request.input('CUR_ID', parseInt(id))

    // Verifica se existem matérias vinculadas ao curso
    const checkQuery = `
      SELECT COUNT(*) as total FROM MATERIA WHERE MAT_IDCURSO = @CUR_ID
    `
    const checkResult = await request.query(checkQuery)

    if (checkResult.recordset[0].total > 0) {
      return NextResponse.json(
        { ok: false, error: 'Não é possível excluir um curso que possui matérias vinculadas.' },
        { status: 409 }
      )
    }

    // Desativa o curso (soft delete)
    const deleteQuery = `
      UPDATE CURSO
      SET CUR_ATIVO = 0
      WHERE CUR_ID = @CUR_ID
    `

    await request.query(deleteQuery)

    return NextResponse.json({
      ok: true,
      message: 'Curso desativado com sucesso!'
    })
  } catch (err) {
    console.error('Erro ao desativar curso:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

