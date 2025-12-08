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

		return NextResponse.json({
			ok: true,
			stats: {
				MEDIA_AVALIACAO: statsRes.rows[0].media_avaliacao,
				TOTAL_AVALIACOES: statsRes.rows[0].total_avaliacoes,
				USUARIO_AVALIACAO: statsRes.rows[0].usuario_avaliacao
			},
			updated: jaAvaliou,
		})
	} catch (err) {
		console.error('Erro ao avaliar resposta:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}


