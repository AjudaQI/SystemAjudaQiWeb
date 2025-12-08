import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { mapColumnsToUpperCase } from '@/lib/pg-helpers'

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
		const resumoRes = await pool.query(`
      SELECT 
        AVG(a.ava_estrela::float) AS media_geral,
        COUNT(*) AS total_avaliacoes
      FROM avaliacaoresposta a
      INNER JOIN resposta r ON r.res_idresposta = a.ava_idresposta
      WHERE r.res_idusuario = $1
    `, [usuarioId])

		const resumo = resumoRes.rows[0] || { media_geral: null, total_avaliacoes: 0 }

		// Buscar lista de respostas avaliadas do usuário
		const listaRes = await pool.query(`
      SELECT 
        a.ava_estrela,
        a.ava_idresposta,
        a.ava_idusuario,
        u_avaliador.usu_nome AS avaliador_nome,
        r.res_descricao,
        r.res_dataresposta
      FROM avaliacaoresposta a
      INNER JOIN resposta r ON r.res_idresposta = a.ava_idresposta
      INNER JOIN usuario u_avaliador ON u_avaliador.usu_id = a.ava_idusuario
      WHERE r.res_idusuario = $1
      ORDER BY r.res_dataresposta DESC
    `, [usuarioId])

		return NextResponse.json({
			ok: true,
			resumo: {
				media: resumo.media_geral,
				total: resumo.total_avaliacoes,
			},
			avaliacoes: listaRes.rows.map(mapColumnsToUpperCase),
		})
	} catch (err) {
		console.error('Erro ao buscar avaliações do usuário:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}



