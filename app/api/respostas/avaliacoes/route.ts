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
		const respostaRes = await pool.query(`
      SELECT res_idresposta, res_idusuario
      FROM resposta
      WHERE res_idresposta = $1
    `, [respostaId])

		if (!respostaRes.rows[0]) {
			return NextResponse.json({ ok: false, error: 'Resposta não encontrada' }, { status: 404 })
		}

		// BLOQUEAR: Usuário não pode avaliar sua própria resposta
		const resposta = respostaRes.rows[0]
		if (resposta.res_idusuario === usuarioId) {
			return NextResponse.json(
				{ ok: false, error: 'Você não pode avaliar sua própria resposta' },
				{ status: 403 },
			)
		}

	// Verificar se o usuário já avaliou esta resposta
	const checkRes = await pool.query(`
      SELECT ava_id
      FROM avaliacaoresposta 
      WHERE ava_idresposta = $1 AND ava_idusuario = $2
    `, [respostaId, usuarioId])

	const jaAvaliou = checkRes.rows.length > 0

	if (jaAvaliou) {
		// Atualizar a avaliação existente
		await pool.query(`
        UPDATE avaliacaoresposta
        SET ava_estrela = $1
        WHERE ava_idresposta = $2 AND ava_idusuario = $3
      `, [ratingValue, respostaId, usuarioId])
	} else {
		// Inserir nova avaliação
		await pool.query(`
        INSERT INTO avaliacaoresposta (
          ava_idresposta,
          ava_idusuario,
          ava_estrela
        )
        VALUES ($1, $2, $3)
      `, [respostaId, usuarioId, ratingValue])
	}

		const statsRes = await pool.query(`
      SELECT 
        -- Excluir autoavaliações do cálculo (avaliador não pode ser o autor da resposta)
        (SELECT AVG(a.ava_estrela::float) 
         FROM avaliacaoresposta a
         INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
         WHERE a.ava_idresposta = $1 
           AND a.ava_idusuario != r_aux.res_idusuario) AS media_avaliacao,
        (SELECT COUNT(*) 
         FROM avaliacaoresposta a
         INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
         WHERE a.ava_idresposta = $1 
           AND a.ava_idusuario != r_aux.res_idusuario) AS total_avaliacoes,
        (SELECT ava_estrela FROM avaliacaoresposta WHERE ava_idresposta = $1 AND ava_idusuario = $2 LIMIT 1) AS usuario_avaliacao
    `, [respostaId, usuarioId])

		const stats = statsRes.rows[0]
		const totalAvaliacoes = parseInt(stats.total_avaliacoes) || 0
		const mediaAvaliacao = parseFloat(stats.media_avaliacao) || 0

		console.log(`[AVALIACAO] Resposta ${respostaId}: ${totalAvaliacoes} votos, média ${mediaAvaliacao.toFixed(2)}`)

		// Obter a dúvida desta resposta para atualizar todas as respostas dela
		const duvidaRes = await pool.query(`
			SELECT r.res_idduvida
			FROM resposta r
			WHERE r.res_idresposta = $1
		`, [respostaId])

		if (!duvidaRes.rows[0]) {
			return NextResponse.json({ ok: false, error: 'Dúvida não encontrada' }, { status: 404 })
		}

		const duvidaId = duvidaRes.rows[0].res_idduvida

		console.log(`[AVALIACAO] Reclassificando respostas da dúvida ${duvidaId}`)

		// Primeiro, remover flag de melhor resposta de TODAS as respostas desta dúvida
		await pool.query(`
			UPDATE resposta
			SET res_melhorresposta = FALSE
			WHERE res_idduvida = $1
		`, [duvidaId])

		// Depois, marcar como melhor resposta apenas a que tem:
		// 1. >= 3 votos
		// 2. A MAIOR média entre todas as respostas da dúvida que atendem o critério acima
		const updateMelhorRes = await pool.query(`
			UPDATE resposta r
			SET res_melhorresposta = TRUE
			WHERE r.res_idresposta = (
				SELECT r2.res_idresposta
				FROM resposta r2
				LEFT JOIN (
					SELECT 
						a.ava_idresposta,
						AVG(a.ava_estrela::float) as media,
						COUNT(*) as total
					FROM avaliacaoresposta a
					INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
					WHERE a.ava_idusuario != r_aux.res_idusuario
					GROUP BY a.ava_idresposta
				) stats ON r2.res_idresposta = stats.ava_idresposta
				WHERE r2.res_idduvida = $1
					AND stats.total >= 3
				ORDER BY stats.media DESC, stats.total DESC
				LIMIT 1
			)
			RETURNING res_idresposta
		`, [duvidaId])

		if (updateMelhorRes.rows[0]) {
			console.log(`[AVALIACAO] ✅ Resposta ${updateMelhorRes.rows[0].res_idresposta} marcada como melhor`)
		} else {
			console.log(`[AVALIACAO] ℹ️ Nenhuma resposta da dúvida ${duvidaId} atende os critérios (≥3 votos)`)
		}

		// Verificar se esta resposta específica ficou marcada como melhor
		const melhorRespostaRes = await pool.query(`
			SELECT res_melhorresposta
			FROM resposta
			WHERE res_idresposta = $1
		`, [respostaId])

		const ehMelhorResposta = melhorRespostaRes.rows[0]?.res_melhorresposta || false

		return NextResponse.json({
			ok: true,
			stats: {
				MEDIA_AVALIACAO: stats.media_avaliacao,
				TOTAL_AVALIACOES: stats.total_avaliacoes,
				USUARIO_AVALIACAO: stats.usuario_avaliacao,
				MELHOR_RESPOSTA: ehMelhorResposta
			},
			updated: jaAvaliou,
		})
	} catch (err) {
		console.error('Erro ao avaliar resposta:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}


