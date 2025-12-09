import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const usuarioIdParam = req.nextUrl.searchParams.get('usuarioId')

    if (!usuarioIdParam || Number.isNaN(Number(usuarioIdParam))) {
      return NextResponse.json(
        { ok: false, error: 'usuarioId é obrigatório e deve ser numérico' },
        { status: 400 }
      )
    }

    const usuarioId = Number(usuarioIdParam)
    const pool = await getPool()

    const result = await pool.query(`
      SELECT COUNT(*)::INTEGER AS qtd_duvidas 
      FROM duvida d
      WHERE d.duv_idusuario = $1::BIGINT
    `, [usuarioId])

    const qtdDuvidas = Number(result.rows[0]?.qtd_duvidas) || 0

    return NextResponse.json({
      ok: true,
      count: qtdDuvidas
    })
  } catch (err) {
    console.error('Erro ao buscar contagem de dúvidas:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

