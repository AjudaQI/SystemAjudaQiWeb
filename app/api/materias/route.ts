import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET - Buscar matérias
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cursoId = searchParams.get('cursoId')
    const periodoId = searchParams.get('periodoId')

    const pool = await getPool()
    const request = pool.request()

    let query = `
      SELECT 
        M.MAT_ID,
        M.MAT_DESC,
        M.MAT_IDCURSO,
        M.MAT_IDPERIODO,
        M.MAT_DESCRICAOCONTEUDO,
        P.PER_DESCRICAO,
        C.CUR_DESC
      FROM MATERIA M
      LEFT JOIN PERIODO P ON M.MAT_IDPERIODO = P.PER_ID
      LEFT JOIN CURSO C ON M.MAT_IDCURSO = C.CUR_ID
      WHERE 1=1
    `

    if (cursoId) {
      request.input('MAT_IDCURSO', parseInt(cursoId))
      query += ` AND M.MAT_IDCURSO = @MAT_IDCURSO`
    }

    if (periodoId) {
      request.input('MAT_IDPERIODO', parseInt(periodoId))
      query += ` AND M.MAT_IDPERIODO = @MAT_IDPERIODO`
    }

    query += ` ORDER BY M.MAT_IDPERIODO, M.MAT_DESC`

    console.log('Query de matérias:', query)
    console.log('Parâmetros:', { cursoId, periodoId })
    
    const materias = await request.query(query)

    console.log('Matérias encontradas:', materias.recordset.length)

    return NextResponse.json({
      ok: true,
      materias: materias.recordset
    })
  } catch (err) {
    console.error('Erro ao buscar matérias:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

// POST - Criar nova matéria
export async function POST(req: NextRequest) {
  try {
    const { descricao, idCurso, idPeriodo, descricaoConteudo } = await req.json()

    if (!descricao || descricao.trim() === '') {
      return NextResponse.json(
        { ok: false, error: 'Descrição da matéria é obrigatória.' },
        { status: 400 }
      )
    }

    if (!idCurso) {
      return NextResponse.json(
        { ok: false, error: 'Curso é obrigatório.' },
        { status: 400 }
      )
    }

    if (!idPeriodo) {
      return NextResponse.json(
        { ok: false, error: 'Período é obrigatório.' },
        { status: 400 }
      )
    }

    const pool = await getPool()
    const request = pool.request()

    request.input('MAT_DESC', descricao.trim())
    request.input('MAT_IDCURSO', parseInt(idCurso))
    request.input('MAT_IDPERIODO', parseInt(idPeriodo))
    request.input('MAT_DESCRICAOCONTEUDO', descricaoConteudo ? descricaoConteudo.trim() : null)

    const insertQuery = `
      INSERT INTO MATERIA (MAT_DESC, MAT_IDCURSO, MAT_IDPERIODO, MAT_DESCRICAOCONTEUDO)
      OUTPUT INSERTED.MAT_ID, INSERTED.MAT_DESC, INSERTED.MAT_IDCURSO, INSERTED.MAT_IDPERIODO, INSERTED.MAT_DESCRICAOCONTEUDO
      VALUES (@MAT_DESC, @MAT_IDCURSO, @MAT_IDPERIODO, @MAT_DESCRICAOCONTEUDO)
    `

    const insertResult = await request.query(insertQuery)

    return NextResponse.json({
      ok: true,
      materia: insertResult.recordset[0],
      message: 'Matéria criada com sucesso!'
    })
  } catch (err) {
    console.error('Erro ao criar matéria:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

// PUT - Atualizar matéria existente
export async function PUT(req: NextRequest) {
  try {
    const { id, descricao, idCurso, idPeriodo, descricaoConteudo } = await req.json()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID da matéria é obrigatório.' },
        { status: 400 }
      )
    }

    if (!descricao || descricao.trim() === '') {
      return NextResponse.json(
        { ok: false, error: 'Descrição da matéria é obrigatória.' },
        { status: 400 }
      )
    }

    if (!idCurso) {
      return NextResponse.json(
        { ok: false, error: 'Curso é obrigatório.' },
        { status: 400 }
      )
    }

    if (!idPeriodo) {
      return NextResponse.json(
        { ok: false, error: 'Período é obrigatório.' },
        { status: 400 }
      )
    }

    const pool = await getPool()
    const request = pool.request()

    request.input('MAT_ID', parseInt(id))
    request.input('MAT_DESC', descricao.trim())
    request.input('MAT_IDCURSO', parseInt(idCurso))
    request.input('MAT_IDPERIODO', parseInt(idPeriodo))
    request.input('MAT_DESCRICAOCONTEUDO', descricaoConteudo ? descricaoConteudo.trim() : null)

    const updateQuery = `
      UPDATE MATERIA
      SET MAT_DESC = @MAT_DESC,
          MAT_IDCURSO = @MAT_IDCURSO,
          MAT_IDPERIODO = @MAT_IDPERIODO,
          MAT_DESCRICAOCONTEUDO = @MAT_DESCRICAOCONTEUDO
      OUTPUT INSERTED.MAT_ID, INSERTED.MAT_DESC, INSERTED.MAT_IDCURSO, INSERTED.MAT_IDPERIODO, INSERTED.MAT_DESCRICAOCONTEUDO
      WHERE MAT_ID = @MAT_ID
    `

    const result = await request.query(updateQuery)

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Matéria não encontrada.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      materia: result.recordset[0],
      message: 'Matéria atualizada com sucesso!'
    })
  } catch (err) {
    console.error('Erro ao atualizar matéria:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

// DELETE - Excluir matéria
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID da matéria é obrigatório.' },
        { status: 400 }
      )
    }

    const pool = await getPool()
    const request = pool.request()

    request.input('MAT_ID', parseInt(id))

    // Verifica se existem dúvidas vinculadas à matéria
    const checkQuery = `
      SELECT COUNT(*) as total FROM DUVIDA WHERE DUV_IDMATERIA = @MAT_ID
    `
    const checkResult = await request.query(checkQuery)

    if (checkResult.recordset[0].total > 0) {
      return NextResponse.json(
        { ok: false, error: 'Não é possível excluir uma matéria que possui dúvidas vinculadas.' },
        { status: 409 }
      )
    }

    // Exclui a matéria
    const deleteQuery = `
      DELETE FROM MATERIA WHERE MAT_ID = @MAT_ID
    `

    await request.query(deleteQuery)

    return NextResponse.json({
      ok: true,
      message: 'Matéria excluída com sucesso!'
    })
  } catch (err) {
    console.error('Erro ao excluir matéria:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

