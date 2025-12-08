import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET - Buscar todos os cursos
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool()

    const query = `
      SELECT 
        cur_id,
        cur_desc,
        cur_ativo
      FROM CURSO
      WHERE cur_ativo = TRUE
      ORDER BY cur_desc
    `

    const result = await pool.query(query)

    // Converter nomes de colunas para maiúsculas (compatibilidade)
    const cursos = result.rows.map(row => ({
      CUR_ID: row.cur_id,
      CUR_DESC: row.cur_desc,
      CUR_ATIVO: row.cur_ativo
    }))

    return NextResponse.json({
      ok: true,
      cursos
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

    // Verifica se já existe um curso com essa descrição
    const checkQuery = `
      SELECT cur_id FROM CURSO WHERE cur_desc = $1
    `
    const checkResult = await pool.query(checkQuery, [descricao.trim()])

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Já existe um curso com esta descrição.' },
        { status: 409 }
      )
    }

    // Insere o novo curso
    const insertQuery = `
      INSERT INTO CURSO (cur_desc, cur_ativo)
      VALUES ($1, TRUE)
      RETURNING cur_id, cur_desc, cur_ativo
    `
    const insertResult = await pool.query(insertQuery, [descricao.trim()])

    const curso = {
      CUR_ID: insertResult.rows[0].cur_id,
      CUR_DESC: insertResult.rows[0].cur_desc,
      CUR_ATIVO: insertResult.rows[0].cur_ativo
    }

    return NextResponse.json({
      ok: true,
      curso,
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

    const updateQuery = `
      UPDATE CURSO
      SET cur_desc = $1,
          cur_ativo = $2
      WHERE cur_id = $3
      RETURNING cur_id, cur_desc, cur_ativo
    `

    const result = await pool.query(updateQuery, [
      descricao.trim(),
      ativo !== undefined ? ativo : true,
      id
    ])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Curso não encontrado.' },
        { status: 404 }
      )
    }

    const curso = {
      CUR_ID: result.rows[0].cur_id,
      CUR_DESC: result.rows[0].cur_desc,
      CUR_ATIVO: result.rows[0].cur_ativo
    }

    return NextResponse.json({
      ok: true,
      curso,
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

    // Verifica se existem matérias vinculadas ao curso
    const checkQuery = `
      SELECT COUNT(*) as total FROM MATERIA WHERE mat_idcurso = $1
    `
    const checkResult = await pool.query(checkQuery, [parseInt(id)])

    if (checkResult.rows[0].total > 0) {
      return NextResponse.json(
        { ok: false, error: 'Não é possível excluir um curso que possui matérias vinculadas.' },
        { status: 409 }
      )
    }

    // Desativa o curso (soft delete)
    const deleteQuery = `
      UPDATE CURSO
      SET cur_ativo = FALSE
      WHERE cur_id = $1
    `

    await pool.query(deleteQuery, [parseInt(id)])

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

