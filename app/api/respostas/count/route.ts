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
      SELECT COUNT(r.res_idresposta)::INTEGER AS qtd_resposta 
      FROM resposta r
      WHERE r.res_idusuario = $1::BIGINT
    `, [usuarioId])

    const qtdRespostas = Number(result.rows[0]?.qtd_resposta) || 0

    return NextResponse.json({
      ok: true,
      count: qtdRespostas
    })
  } catch (err) {
    console.error('Erro ao buscar contagem de respostas:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

