import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET - Buscar todos os períodos
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool()

    const query = `
      SELECT 
        per_id,
        per_descricao,
        per_ativo
      FROM PERIODO
      WHERE per_ativo = TRUE
      ORDER BY per_id
    `

    const result = await pool.query(query)

    // Converter nomes de colunas para maiúsculas (compatibilidade)
    const periodos = result.rows.map(row => ({
      PER_ID: row.per_id,
      PER_DESCRICAO: row.per_descricao,
      PER_ATIVO: row.per_ativo
    }))

    return NextResponse.json({
      ok: true,
      periodos
    })
  } catch (err) {
    console.error('Erro ao buscar períodos:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

