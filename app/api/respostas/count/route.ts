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

    const result = await request.query<{ qtd_resposta: number }>(`
      SELECT COUNT(R.RES_IDRESPOSTA) AS qtd_resposta 
      FROM RESPOSTA R
      WHERE R.RES_IDUSUARIO = @USU_ID
    `)

    const qtdRespostas = result.recordset[0]?.qtd_resposta || 0

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

