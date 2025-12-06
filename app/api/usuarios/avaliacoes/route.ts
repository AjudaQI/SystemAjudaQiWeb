import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET(req: NextRequest) {
	try {
		const usuarioIdParam = req.nextUrl.searchParams.get('usuarioId')

		if (!usuarioIdParam || Number.isNaN(Number(usuarioIdParam))) {
			return NextResponse.json(
				{ ok: false, error: 'usuarioId é obrigatório e deve ser numérico' },
				{ status: 400 },
			)
		}

		const usuarioId = Number(usuarioIdParam)
		const pool = await getPool()

		// Buscar resumo (média e total de avaliações) usando a tabela de avaliações/respostas
		const resumoReq = pool.request()
		resumoReq.input('USUARIO_ID', usuarioId)

		const resumoRes = await resumoReq.query<{
			MEDIA_GERAL: number | null
			TOTAL_AVALIACOES: number
		}>(`
      SELECT 
        AVG(CAST(A.AVA_ESTRELA AS FLOAT)) AS MEDIA_GERAL,
        COUNT(*) AS TOTAL_AVALIACOES
      FROM AVALIACAORESPOSTA A
      INNER JOIN RESPOSTA R ON R.RES_IDRESPOSTA = A.AVA_IDRESPOSTA
      WHERE R.RES_IDUSUARIO = @USUARIO_ID
    `)

		const resumo = resumoRes.recordset[0] || { MEDIA_GERAL: null, TOTAL_AVALIACOES: 0 }

		// Buscar lista de respostas avaliadas do usuário
		const listaReq = pool.request()
		listaReq.input('USUARIO_ID', usuarioId)

		const listaRes = await listaReq.query<{
			AVA_ESTRELA: number
			AVA_IDRESPOSTA: number
			AVA_IDUSUARIO: number
			AVALIADOR_NOME: string
			RES_DESCRICAO: string
			RES_DATARESPOSTA: string
		}>(`
      SELECT 
        A.AVA_ESTRELA,
        A.AVA_IDRESPOSTA,
        A.AVA_IDUSUARIO,
        U_AVALIADOR.USU_NOME AS AVALIADOR_NOME,
        R.RES_DESCRICAO,
        R.RES_DATARESPOSTA
      FROM AVALIACAORESPOSTA A
      INNER JOIN RESPOSTA R ON R.RES_IDRESPOSTA = A.AVA_IDRESPOSTA
      INNER JOIN USUARIO U_AVALIADOR ON U_AVALIADOR.USU_ID = A.AVA_IDUSUARIO
      WHERE R.RES_IDUSUARIO = @USUARIO_ID
      ORDER BY R.RES_DATARESPOSTA DESC
    `)

		return NextResponse.json({
			ok: true,
			resumo: {
				media: resumo.MEDIA_GERAL,
				total: resumo.TOTAL_AVALIACOES,
			},
			avaliacoes: listaRes.recordset,
		})
	} catch (err) {
		console.error('Erro ao buscar avaliações do usuário:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}


