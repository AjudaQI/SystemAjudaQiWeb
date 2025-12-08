import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(req: NextRequest) {
	try {
		const { duvidaId, usuarioId, descricao } = await req.json()

		if (!duvidaId || !usuarioId || !descricao || !descricao.trim()) {
			return NextResponse.json(
				{ ok: false, error: 'duvidaId, usuarioId e descricao são obrigatórios' },
				{ status: 400 },
			)
		}

		const pool = await getPool()

		// Verificar se o usuário existe e está ativo
		const userRes = await pool.query(`
      SELECT 
        u.usu_id, 
        u.usu_nome,
        cu.cur_desc AS usuario_curso_desc,
        pu.per_descricao AS usuario_periodo_desc
      FROM usuario u
      LEFT JOIN curso cu ON u.usu_idcurso = cu.cur_id
      LEFT JOIN periodo pu ON u.usu_idperiodo = pu.per_id
      WHERE u.usu_id = $1 AND u.usu_ativo = TRUE
    `, [usuarioId])

		const usuario = userRes.rows[0]

		if (!usuario) {
			return NextResponse.json({ ok: false, error: 'Usuário não encontrado ou inativo' }, { status: 404 })
		}

		// Verificar se a dúvida existe
		const duvidaRes = await pool.query(`
      SELECT duv_idduvida
      FROM duvida
      WHERE duv_idduvida = $1
    `, [duvidaId])

		if (!duvidaRes.rows[0]) {
			return NextResponse.json({ ok: false, error: 'Dúvida não encontrada' }, { status: 404 })
		}

		// Inserir a resposta
		const insertRes = await pool.query(`
      INSERT INTO resposta (
        res_idduvida,
        res_idusuario,
        res_descricao
      )
      VALUES ($1, $2, $3)
      RETURNING res_idresposta, res_dataresposta
    `, [duvidaId, usuarioId, descricao.trim()])

		return NextResponse.json(
			{
				ok: true,
				resposta: {
					RES_IDRESPOSTA: insertRes.rows[0].res_idresposta,
					RES_IDDUVIDA: duvidaId,
					RES_IDUSUARIO: usuarioId,
					RES_DESCRICAO: descricao.trim(),
					RES_DATARESPOSTA: insertRes.rows[0].res_dataresposta,
					USU_NOME: usuario.usu_nome,
					USUARIO_CURSO_DESC: usuario.usuario_curso_desc,
					USUARIO_PERIODO_DESC: usuario.usuario_periodo_desc,
				},
			},
			{ status: 201 },
		)
	} catch (err) {
		console.error('Erro ao criar resposta:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}

export async function GET(req: NextRequest) {
	try {
		const duvidaId = req.nextUrl.searchParams.get('duvidaId')
		const usuarioIdParam = req.nextUrl.searchParams.get('usuarioId')
		const pool = await getPool()

		const params: any[] = []
		let paramCount = 1

		if (duvidaId) {
			params.push(parseInt(duvidaId, 10))
		}

		const hasUsuarioParam = usuarioIdParam ? !Number.isNaN(Number(usuarioIdParam)) : false

		if (hasUsuarioParam) {
			params.push(parseInt(usuarioIdParam as string, 10))
		}

		const whereClause = duvidaId ? `WHERE r.res_idduvida = $${paramCount}` : ''
		const usuarioParamIndex = duvidaId ? 2 : 1
		
		const usuarioAvaliacaoSelect = hasUsuarioParam
			? `,
        -- Só retornar USUARIO_AVALIACAO se o usuário não for o autor da resposta
        CASE 
          WHEN r.res_idusuario = $${usuarioParamIndex} THEN NULL
          ELSE (SELECT ava_estrela 
                FROM avaliacaoresposta 
                WHERE ava_idresposta = r.res_idresposta AND ava_idusuario = $${usuarioParamIndex}
                LIMIT 1)
        END AS usuario_avaliacao`
			: `,
        NULL AS usuario_avaliacao`
		
		console.log('[DEBUG API] usuarioAvaliacaoSelect será incluído:', hasUsuarioParam)

		const respostas = await pool.query(`
      SELECT 
        r.res_idresposta,
        r.res_idduvida,
        r.res_idusuario,
        r.res_descricao,
        r.res_dataresposta,
        r.res_melhorresposta,
        u.usu_nome,
        (SELECT AVG(a.ava_estrela::float)
         FROM resposta r2
         INNER JOIN avaliacaoresposta a ON a.ava_idresposta = r2.res_idresposta
         WHERE r2.res_idusuario = u.usu_id
        ) AS usu_avaliacao,
        cu.cur_desc AS usuario_curso_desc,
        pu.per_descricao AS usuario_periodo_desc,
        -- Excluir autoavaliações do cálculo (avaliador não pode ser o autor da resposta)
        (SELECT AVG(a.ava_estrela::float) 
         FROM avaliacaoresposta a
         INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
         WHERE a.ava_idresposta = r.res_idresposta 
           AND a.ava_idusuario != r_aux.res_idusuario) AS media_avaliacao,
        (SELECT COUNT(*) 
         FROM avaliacaoresposta a
         INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
         WHERE a.ava_idresposta = r.res_idresposta 
           AND a.ava_idusuario != r_aux.res_idusuario) AS total_avaliacoes
        ${usuarioAvaliacaoSelect}
      FROM resposta r
      INNER JOIN usuario u ON r.res_idusuario = u.usu_id
      LEFT JOIN curso cu ON u.usu_idcurso = cu.cur_id
      LEFT JOIN periodo pu ON u.usu_idperiodo = pu.per_id
      ${whereClause}
      ORDER BY r.res_dataresposta DESC
    `, params)

	return NextResponse.json({
		ok: true,
		respostas: respostas.rows.map(row => ({
			RES_IDRESPOSTA: row.res_idresposta,
			RES_IDDUVIDA: row.res_idduvida,
			RES_IDUSUARIO: row.res_idusuario,
			RES_DESCRICAO: row.res_descricao,
			RES_DATARESPOSTA: row.res_dataresposta,
			RES_MELHORRESPOSTA: row.res_melhorresposta,
			USU_NOME: row.usu_nome,
			USU_AVALIACAO: row.usu_avaliacao,
			USUARIO_CURSO_DESC: row.usuario_curso_desc,
			USUARIO_PERIODO_DESC: row.usuario_periodo_desc,
			MEDIA_AVALIACAO: row.media_avaliacao,
			TOTAL_AVALIACOES: row.total_avaliacoes,
			USUARIO_AVALIACAO: row.usuario_avaliacao
		})),
	})
	} catch (err) {
		console.error('Erro ao buscar respostas:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}

export async function PUT(req: NextRequest) {
	try {
		const { respostaId, usuarioId, descricao } = await req.json()

		if (!respostaId || !usuarioId || !descricao || !descricao.trim()) {
			return NextResponse.json(
				{ ok: false, error: 'respostaId, usuarioId e descricao são obrigatórios' },
				{ status: 400 },
			)
		}

		const pool = await getPool()

		// Verificar se a resposta existe e se pertence ao usuário
		const checkRes = await pool.query(`
      SELECT res_idresposta, res_idusuario
      FROM resposta
      WHERE res_idresposta = $1
    `, [respostaId])

		if (!checkRes.rows[0]) {
			return NextResponse.json(
				{ ok: false, error: 'Resposta não encontrada' },
				{ status: 404 },
			)
		}

		// Verificar se a resposta pertence ao usuário
		const respostaUsuarioId = typeof checkRes.rows[0].res_idusuario === 'string'
			? parseInt(checkRes.rows[0].res_idusuario, 10)
			: Number(checkRes.rows[0].res_idusuario)
		
		const usuarioIdNumber = typeof usuarioId === 'string' ? parseInt(usuarioId, 10) : Number(usuarioId)

		if (respostaUsuarioId !== usuarioIdNumber) {
			return NextResponse.json(
				{ ok: false, error: 'Você não tem permissão para editar esta resposta' },
				{ status: 403 },
			)
		}

		// Atualizar a resposta
		await pool.query(`
      UPDATE resposta
      SET res_descricao = $1
      WHERE res_idresposta = $2
    `, [descricao.trim(), respostaId])

		return NextResponse.json({
			ok: true,
			message: 'Resposta atualizada com sucesso',
		})
	} catch (err) {
		console.error('Erro ao atualizar resposta:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const { respostaId, usuarioId } = await req.json()

		if (!respostaId || !usuarioId) {
			return NextResponse.json(
				{ ok: false, error: 'respostaId e usuarioId são obrigatórios' },
				{ status: 400 },
			)
		}

		const pool = await getPool()

		// Verificar se a resposta existe e se pertence ao usuário, e buscar permissão do usuário
		const checkRes = await pool.query(`
      SELECT r.res_idresposta, r.res_idusuario, u.usu_idpermissao
      FROM resposta r
      LEFT JOIN usuario u ON u.usu_id = $2
      WHERE r.res_idresposta = $1
    `, [respostaId, usuarioId])

		if (!checkRes.rows[0]) {
			return NextResponse.json(
				{ ok: false, error: 'Resposta não encontrada' },
				{ status: 404 },
			)
		}

		// Verificar se a resposta pertence ao usuário OU se é admin (permissão 2)
		const respostaUsuarioId = typeof checkRes.rows[0].res_idusuario === 'string'
			? parseInt(checkRes.rows[0].res_idusuario, 10)
			: Number(checkRes.rows[0].res_idusuario)
		
		const usuarioIdNumber = typeof usuarioId === 'string' ? parseInt(usuarioId, 10) : Number(usuarioId)
		const usuarioPermissao = checkRes.rows[0].usu_idpermissao

		const isAdmin = usuarioPermissao === 2 || usuarioPermissao === '2'
		const isOwner = respostaUsuarioId === usuarioIdNumber

		if (!isOwner && !isAdmin) {
			return NextResponse.json(
				{ ok: false, error: 'Você não tem permissão para excluir esta resposta' },
				{ status: 403 },
			)
		}

		// Excluir a resposta (as avaliações e comentários serão excluídos automaticamente devido ao CASCADE)
		await pool.query(`
      DELETE FROM resposta
      WHERE res_idresposta = $1
    `, [respostaId])

		return NextResponse.json({
			ok: true,
			message: 'Resposta excluída com sucesso',
		})
	} catch (err) {
		console.error('Erro ao excluir resposta:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}

