import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET - Buscar todos os períodos
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool()
    const request = pool.request()

    const query = `
      SELECT 
        PER_ID,
        PER_DESCRICAO,
        PER_ATIVO
      FROM PERIODO
      WHERE PER_ATIVO = 1
      ORDER BY PER_ID
    `

    const result = await request.query(query)

    return NextResponse.json({
      ok: true,
      periodos: result.recordset
    })
  } catch (err) {
    console.error('Erro ao buscar períodos:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

