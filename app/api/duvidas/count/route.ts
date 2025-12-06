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
    const request = pool.request()
    request.input('USU_ID', usuarioId)

    const result = await request.query<{ qtd_duvidas: number }>(`
      SELECT COUNT(*) AS qtd_duvidas 
      FROM DUVIDA D
      WHERE D.DUV_IDUSUARIO = @USU_ID
    `)

    const qtdDuvidas = result.recordset[0]?.qtd_duvidas || 0

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

