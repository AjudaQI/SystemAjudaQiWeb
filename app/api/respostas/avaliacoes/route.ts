import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(req: NextRequest) {
	try {
		const { respostaId, usuarioId, estrela } = await req.json()

		if (!respostaId || !usuarioId || estrela === undefined || estrela === null) {
			return NextResponse.json(
				{ ok: false, error: 'respostaId, usuarioId e estrela são obrigatórios' },
				{ status: 400 },
			)
		}

		const ratingValue = Number(estrela)

		if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
			return NextResponse.json(
				{ ok: false, error: 'A avaliação deve ser um número inteiro entre 1 e 5' },
				{ status: 400 },
			)
		}

		const pool = await getPool()

		// Garantir que a resposta existe e verificar se o usuário não é o autor
		const respostaCheck = pool.request()
		respostaCheck.input('RESPOSTA_ID', respostaId)
		const respostaRes = await respostaCheck.query<{ RES_IDRESPOSTA: number; RES_IDUSUARIO: number }>(`
      SELECT RES_IDRESPOSTA, RES_IDUSUARIO
      FROM RESPOSTA
      WHERE RES_IDRESPOSTA = @RESPOSTA_ID
    `)

		if (!respostaRes.recordset[0]) {
			return NextResponse.json({ ok: false, error: 'Resposta não encontrada' }, { status: 404 })
		}

		// BLOQUEAR: Usuário não pode avaliar sua própria resposta
		const resposta = respostaRes.recordset[0]
		if (resposta.RES_IDUSUARIO === usuarioId) {
			return NextResponse.json(
				{ ok: false, error: 'Você não pode avaliar sua própria resposta' },
				{ status: 403 },
			)
		}

	// Verificar se o usuário já avaliou esta resposta
	const checkReq = pool.request()
	checkReq.input('RESPOSTA_ID', respostaId)
	checkReq.input('USUARIO_ID', usuarioId)
	
	const checkRes = await checkReq.query<{ AVA_ID: number }>(`
      SELECT AVA_ID
      FROM AVALIACAORESPOSTA 
      WHERE AVA_IDRESPOSTA = @RESPOSTA_ID AND AVA_IDUSUARIO = @USUARIO_ID
    `)

	const jaAvaliou = checkRes.recordset.length > 0

	if (jaAvaliou) {
		// Atualizar a avaliação existente
		const updateReq = pool.request()
		updateReq.input('RESPOSTA_ID', respostaId)
		updateReq.input('USUARIO_ID', usuarioId)
		updateReq.input('ESTRELA', ratingValue)

		await updateReq.query(`
        UPDATE AVALIACAORESPOSTA
        SET AVA_ESTRELA = @ESTRELA
        WHERE AVA_IDRESPOSTA = @RESPOSTA_ID AND AVA_IDUSUARIO = @USUARIO_ID
      `)
	} else {
		// Inserir nova avaliação
		const insertReq = pool.request()
		insertReq.input('RESPOSTA_ID', respostaId)
		insertReq.input('USUARIO_ID', usuarioId)
		insertReq.input('ESTRELA', ratingValue)

		await insertReq.query(`
        INSERT INTO AVALIACAORESPOSTA (
          AVA_IDRESPOSTA,
          AVA_IDUSUARIO,
          AVA_ESTRELA
        )
        VALUES (
          @RESPOSTA_ID,
          @USUARIO_ID,
          @ESTRELA
        )
      `)
	}

		const statsReq = pool.request()
		statsReq.input('RESPOSTA_ID', respostaId)
		statsReq.input('USUARIO_ID', usuarioId)

		const statsRes = await statsReq.query<{
			MEDIA_AVALIACAO: number | null
			TOTAL_AVALIACOES: number
			USUARIO_AVALIACAO: number | null
		}>(`
      SELECT 
        -- Excluir autoavaliações do cálculo (avaliador não pode ser o autor da resposta)
        (SELECT AVG(CAST(A.AVA_ESTRELA AS FLOAT)) 
         FROM AVALIACAORESPOSTA A
         INNER JOIN RESPOSTA R_AUX ON A.AVA_IDRESPOSTA = R_AUX.RES_IDRESPOSTA
         WHERE A.AVA_IDRESPOSTA = @RESPOSTA_ID 
           AND A.AVA_IDUSUARIO != R_AUX.RES_IDUSUARIO) AS MEDIA_AVALIACAO,
        (SELECT COUNT(*) 
         FROM AVALIACAORESPOSTA A
         INNER JOIN RESPOSTA R_AUX ON A.AVA_IDRESPOSTA = R_AUX.RES_IDRESPOSTA
         WHERE A.AVA_IDRESPOSTA = @RESPOSTA_ID 
           AND A.AVA_IDUSUARIO != R_AUX.RES_IDUSUARIO) AS TOTAL_AVALIACOES,
        (SELECT TOP 1 AVA_ESTRELA FROM AVALIACAORESPOSTA WHERE AVA_IDRESPOSTA = @RESPOSTA_ID AND AVA_IDUSUARIO = @USUARIO_ID) AS USUARIO_AVALIACAO
    `)

		return NextResponse.json({
			ok: true,
			stats: statsRes.recordset[0],
			updated: jaAvaliou,
		})
	} catch (err) {
		console.error('Erro ao avaliar resposta:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}


