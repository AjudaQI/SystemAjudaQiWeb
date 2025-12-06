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
		const userCheck = pool.request()
		userCheck.input('USU_ID', usuarioId)
		const userRes = await userCheck.query<{
			USU_ID: number
			USU_NOME: string
			USUARIO_CURSO_DESC: string | null
			USUARIO_PERIODO_DESC: string | null
		}>(`
      SELECT 
        U.USU_ID, 
        U.USU_NOME,
        CU.CUR_DESC AS USUARIO_CURSO_DESC,
        PU.PER_DESCRICAO AS USUARIO_PERIODO_DESC
      FROM USUARIO U
      LEFT JOIN CURSO CU ON U.USU_IDCURSO = CU.CUR_ID
      LEFT JOIN PERIODO PU ON U.USU_IDPERIODO = PU.PER_ID
      WHERE U.USU_ID = @USU_ID AND U.USU_ATIVO = 1
    `)

		const usuario = userRes.recordset[0]

		if (!usuario) {
			return NextResponse.json({ ok: false, error: 'Usuário não encontrado ou inativo' }, { status: 404 })
		}

		// Verificar se a dúvida existe
		const duvidaCheck = pool.request()
		duvidaCheck.input('DUV_IDDUVIDA', duvidaId)
		const duvidaRes = await duvidaCheck.query<{ DUV_IDDUVIDA: number }>(`
      SELECT DUV_IDDUVIDA
      FROM DUVIDA
      WHERE DUV_IDDUVIDA = @DUV_IDDUVIDA
    `)

		if (!duvidaRes.recordset[0]) {
			return NextResponse.json({ ok: false, error: 'Dúvida não encontrada' }, { status: 404 })
		}

		// Inserir a resposta
		const insertReq = pool.request()
		insertReq.input('RES_IDDUVIDA', duvidaId)
		insertReq.input('RES_IDUSUARIO', usuarioId)
		insertReq.input('RES_DESCRICAO', descricao.trim())

		const insertRes = await insertReq.query<{ RES_IDRESPOSTA: number; RES_DATARESPOSTA: string }>(`
      INSERT INTO RESPOSTA (
        RES_IDDUVIDA,
        RES_IDUSUARIO,
        RES_DESCRICAO
      )
      OUTPUT INSERTED.RES_IDRESPOSTA, INSERTED.RES_DATARESPOSTA
      VALUES (
        @RES_IDDUVIDA,
        @RES_IDUSUARIO,
        @RES_DESCRICAO
      )
    `)

		return NextResponse.json(
			{
				ok: true,
				resposta: {
					RES_IDRESPOSTA: insertRes.recordset[0].RES_IDRESPOSTA,
					RES_IDDUVIDA: duvidaId,
					RES_IDUSUARIO: usuarioId,
					RES_DESCRICAO: descricao.trim(),
					RES_DATARESPOSTA: insertRes.recordset[0].RES_DATARESPOSTA,
					USU_NOME: usuario.USU_NOME,
					USUARIO_CURSO_DESC: usuario.USUARIO_CURSO_DESC,
					USUARIO_PERIODO_DESC: usuario.USUARIO_PERIODO_DESC,
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
		const request = pool.request()

		if (duvidaId) {
			request.input('RES_IDDUVIDA', parseInt(duvidaId, 10))
		}

		const hasUsuarioParam = usuarioIdParam ? !Number.isNaN(Number(usuarioIdParam)) : false

		if (hasUsuarioParam) {
			request.input('USUARIO_ID', parseInt(usuarioIdParam as string, 10))
		}

		const whereClause = duvidaId ? 'WHERE R.RES_IDDUVIDA = @RES_IDDUVIDA' : ''
		const usuarioAvaliacaoSelect = hasUsuarioParam
			? `,
        (SELECT TOP 1 AVA_ESTRELA 
         FROM AVALIACAORESPOSTA 
         WHERE AVA_IDRESPOSTA = R.RES_IDRESPOSTA AND AVA_IDUSUARIO = @USUARIO_ID
        ) AS USUARIO_AVALIACAO`
			: `,
        NULL AS USUARIO_AVALIACAO`
		
		console.log('[DEBUG API] usuarioAvaliacaoSelect será incluído:', hasUsuarioParam)

		const respostas = await request.query(`
      SELECT 
        R.RES_IDRESPOSTA,
        R.RES_IDDUVIDA,
        R.RES_IDUSUARIO,
        R.RES_DESCRICAO,
        R.RES_DATARESPOSTA,
        R.RES_MELHORRESPOSTA,
        U.USU_NOME,
        (SELECT AVG(CAST(A.AVA_ESTRELA AS FLOAT))
         FROM RESPOSTA R2
         INNER JOIN AVALIACAORESPOSTA A ON A.AVA_IDRESPOSTA = R2.RES_IDRESPOSTA
         WHERE R2.RES_IDUSUARIO = U.USU_ID
        ) AS USU_AVALIACAO,
        CU.CUR_DESC AS USUARIO_CURSO_DESC,
        PU.PER_DESCRICAO AS USUARIO_PERIODO_DESC,
        (SELECT AVG(CAST(AVA_ESTRELA AS FLOAT)) 
         FROM AVALIACAORESPOSTA 
         WHERE AVA_IDRESPOSTA = R.RES_IDRESPOSTA) AS MEDIA_AVALIACAO,
        (SELECT COUNT(*) 
         FROM AVALIACAORESPOSTA 
         WHERE AVA_IDRESPOSTA = R.RES_IDRESPOSTA) AS TOTAL_AVALIACOES
        ${usuarioAvaliacaoSelect}
      FROM RESPOSTA R
      INNER JOIN USUARIO U ON R.RES_IDUSUARIO = U.USU_ID
      LEFT JOIN CURSO CU ON U.USU_IDCURSO = CU.CUR_ID
      LEFT JOIN PERIODO PU ON U.USU_IDPERIODO = PU.PER_ID
      ${whereClause}
      ORDER BY R.RES_DATARESPOSTA DESC
    `)

	return NextResponse.json({
		ok: true,
		respostas: respostas.recordset,
	})
	} catch (err) {
		console.error('Erro ao buscar respostas:', err)
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}


