import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { mapColumnsToUpperCase } from '@/lib/pg-helpers'

// GET - Buscar matérias
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cursoId = searchParams.get('cursoId')
    const periodoId = searchParams.get('periodoId')

    const pool = await getPool()

    let query = `
      SELECT 
        m.mat_id,
        m.mat_desc,
        m.mat_idcurso,
        m.mat_idperiodo,
        m.mat_descricaoconteudo,
        p.per_descricao,
        c.cur_desc
      FROM materia m
      LEFT JOIN periodo p ON m.mat_idperiodo = p.per_id
      LEFT JOIN curso c ON m.mat_idcurso = c.cur_id
      WHERE 1=1
    `

    const params: any[] = []
    let paramCount = 1

    if (cursoId) {
      query += ` AND m.mat_idcurso = $${paramCount}`
      params.push(parseInt(cursoId))
      paramCount++
    }

    if (periodoId) {
      query += ` AND m.mat_idperiodo = $${paramCount}`
      params.push(parseInt(periodoId))
      paramCount++
    }

    query += ` ORDER BY m.mat_idperiodo, m.mat_desc`

    console.log('Query de matérias:', query)
    console.log('Parâmetros:', { cursoId, periodoId })
    
    const materias = await pool.query(query, params)

    console.log('Matérias encontradas:', materias.rows.length)

    return NextResponse.json({
      ok: true,
      materias: materias.rows.map(mapColumnsToUpperCase)
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

    const insertResult = await pool.query(`
      INSERT INTO materia (mat_desc, mat_idcurso, mat_idperiodo, mat_descricaoconteudo)
      VALUES ($1, $2, $3, $4)
      RETURNING mat_id, mat_desc, mat_idcurso, mat_idperiodo, mat_descricaoconteudo
    `, [descricao.trim(), parseInt(idCurso), parseInt(idPeriodo), descricaoConteudo ? descricaoConteudo.trim() : null])

    return NextResponse.json({
      ok: true,
      materia: mapColumnsToUpperCase(insertResult.rows[0]),
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

    const result = await pool.query(`
      UPDATE materia
      SET mat_desc = $1,
          mat_idcurso = $2,
          mat_idperiodo = $3,
          mat_descricaoconteudo = $4
      WHERE mat_id = $5
      RETURNING mat_id, mat_desc, mat_idcurso, mat_idperiodo, mat_descricaoconteudo
    `, [descricao.trim(), parseInt(idCurso), parseInt(idPeriodo), descricaoConteudo ? descricaoConteudo.trim() : null, parseInt(id)])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Matéria não encontrada.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      materia: mapColumnsToUpperCase(result.rows[0]),
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

    // Verifica se existem dúvidas vinculadas à matéria
    const checkResult = await pool.query(`
      SELECT COUNT(*) as total FROM duvida WHERE duv_idmateria = $1
    `, [parseInt(id)])

    if (checkResult.rows[0].total > 0) {
      return NextResponse.json(
        { ok: false, error: 'Não é possível excluir uma matéria que possui dúvidas vinculadas.' },
        { status: 409 }
      )
    }

    // Exclui a matéria
    await pool.query(`
      DELETE FROM materia WHERE mat_id = $1
    `, [parseInt(id)])

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

