import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

// GET - Buscar todos os usuários
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool()
    const request = pool.request()

    const query = `
      SELECT 
        U.USU_ID,
        U.USU_MATRICULA,
        U.USU_NOME,
        U.USU_EMAIL,
        U.USU_IDPERMISSAO,
        U.USU_IDCURSO,
        U.USU_IDPERIODO,
        U.USU_ATIVO,
        C.CUR_DESC,
        P.PER_DESCRICAO,
        PU.PU_NOMEPERMISSAO
      FROM USUARIO U
      LEFT JOIN CURSO C ON U.USU_IDCURSO = C.CUR_ID
      LEFT JOIN PERIODO P ON U.USU_IDPERIODO = P.PER_ID
      LEFT JOIN PERMISSAOUSUARIO PU ON U.USU_IDPERMISSAO = PU.PU_IDPERMISSAO
      ORDER BY U.USU_NOME
    `

    const result = await request.query(query)

    return NextResponse.json({
      ok: true,
      usuarios: result.recordset,
      total: result.recordset.length
    })
  } catch (err) {
    console.error('Erro ao buscar usuários:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

const fullSchema = z.object({
	idPermissao: z.number().int().nonnegative().default(3),
	matricula: z.number().int().positive().optional(),
	nome: z.string().min(2).max(150),
	cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos').optional(),
	senha: z.string().min(6),
	email: z.string().email().max(100),
	// USU_ATIVO: 0 = ativo, 1 = inativo. Padrão: 0 (ativo)
	ativo: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional().default(0),
	curso: z.union([z.string(), z.number().int().nonnegative()]).optional(),
	periodo: z.union([z.string(), z.number().int().positive()]).optional(),
})

function toBitActive(value: unknown): 0 | 1 {
	if (typeof value === 'number') return value === 0 ? 0 : 1
	if (typeof value === 'boolean') return value ? 1 : 0
	return 0
}

function generateRandomCpf(): string {
	let cpf = ''
	for (let i = 0; i < 11; i++) cpf += Math.floor(Math.random() * 10).toString()
	return cpf
}

function generateMatricula(): number {
	const year = new Date().getFullYear()
	const rand = Math.floor(Math.random() * 90000) + 10000
	return Number(`${year}${rand}`)
}

export async function POST(req: Request) {
	let parsed: z.infer<typeof fullSchema>
	try {
		const json = await req.json()
		parsed = fullSchema.parse(json)
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json({ ok: false, error: 'Dados inválidos', issues: err.flatten() }, { status: 422 })
		}
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
	}

	try {
		const senhaHash = crypto.createHash('sha512').update(parsed.senha).digest('hex')

		// Checagem prévia de conflitos para retornar todos os campos já cadastrados
		try {
			const pool = await getPool()
			const checkReq = pool.request()
			const matriculaToUse = parsed.matricula ?? null
			const cpfToUse = parsed.cpf ?? null
			checkReq.input('USU_EMAIL', parsed.email)
			if (matriculaToUse !== null) checkReq.input('USU_MATRICULA', matriculaToUse)
			if (cpfToUse !== null) checkReq.input('USU_CPF', cpfToUse)

			const whereClauses: string[] = ["USU_EMAIL = @USU_EMAIL"]
			if (matriculaToUse !== null) whereClauses.push("USU_MATRICULA = @USU_MATRICULA")
			if (cpfToUse !== null) whereClauses.push("USU_CPF = @USU_CPF")

			const checkSql = `
			SELECT
				MAX(CASE WHEN USU_EMAIL = @USU_EMAIL THEN 1 ELSE 0 END) AS emailExists,
				MAX(CASE WHEN ${matriculaToUse !== null ? 'USU_MATRICULA = @USU_MATRICULA' : '1=0'} THEN 1 ELSE 0 END) AS matriculaExists,
				MAX(CASE WHEN ${cpfToUse !== null ? 'USU_CPF = @USU_CPF' : '1=0'} THEN 1 ELSE 0 END) AS cpfExists
			FROM USUARIO
			WHERE ${whereClauses.join(' OR ')}
			`

			const checkRes = await checkReq.query<{ emailExists: number; matriculaExists: number; cpfExists: number }>(checkSql)
			const row = checkRes.recordset[0]
			const conflicts = {
				email: !!row?.emailExists,
				matricula: !!row?.matriculaExists,
				cpf: !!row?.cpfExists,
			}
			if (conflicts.email || conflicts.matricula || conflicts.cpf) {
				return NextResponse.json({ ok: false, error: 'Conflitos de dados', conflicts }, { status: 409 })
			}
		} catch (preErr) {
			// Se a checagem falhar, segue o fluxo normal e será tratado mais abaixo se houver erro
		}

		let tentativa = 0
		while (tentativa < 5) {
			try {
				const pool = await getPool()
				const request = pool.request()

				const matricula = parsed.matricula ?? generateMatricula()
				const cpf = parsed.cpf ?? generateRandomCpf()
				const ativoBit = 1

				request.input('USU_IDPERMISSAO', parsed.idPermissao)
				request.input('USU_MATRICULA', matricula)
				request.input('USU_NOME', parsed.nome)
				request.input('USU_CPF', cpf)
				request.input('USU_SENHA', Buffer.from(senhaHash, 'hex'))
				request.input('USU_EMAIL', parsed.email)
				request.input('USU_ATIVO', ativoBit)

				const insertFields: string[] = [
					'USU_IDPERMISSAO',
					'USU_MATRICULA',
					'USU_NOME',
					'USU_CPF',
					'USU_SENHA',
					'USU_EMAIL',
					'USU_ATIVO'
				]
				const insertValues: string[] = [
					'@USU_IDPERMISSAO',
					'@USU_MATRICULA',
					'@USU_NOME',
					'@USU_CPF',
					'@USU_SENHA',
					'@USU_EMAIL',
					'@USU_ATIVO'
				]

				if (parsed.curso !== undefined && parsed.curso !== null) {
					const cursoId = typeof parsed.curso === 'string' ? Number(parsed.curso) : parsed.curso
					request.input('USU_IDCURSO', cursoId)
					insertFields.push('USU_IDCURSO')
					insertValues.push('@USU_IDCURSO')
				}

				if (parsed.periodo !== undefined && parsed.periodo !== null) {
					const periodoId = typeof parsed.periodo === 'string' ? Number(parsed.periodo) : parsed.periodo
					request.input('USU_IDPERIODO', periodoId)
					insertFields.push('USU_IDPERIODO')
					insertValues.push('@USU_IDPERIODO')
				}

				const insertSql = `
				INSERT INTO USUARIO (
					${insertFields.join(', ')}
				) OUTPUT INSERTED.USU_ID
				VALUES (${insertValues.join(', ')})
				`

				const result = await request.query<{ USU_ID: number }>(insertSql)
				const newId = result.recordset[0]?.USU_ID

				return NextResponse.json({ ok: true, id: newId })
			} catch (e) {
				const msg = (e as Error & { code?: string }).message || ''
				if (/UNIQUE|duplicate|unique key|IX_|UQ_|CPF|MATRICULA/i.test(msg)) {
					tentativa++
					continue
				}
				if ((e as any)?.code === 'ESOCKET' || /ECONN|ETIMEOUT|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
					return NextResponse.json({ ok: false, error: 'Falha de conexão com o banco de dados' }, { status: 503 })
				}
				throw e
			}
		}

		throw new Error('Não foi possível gerar CPF/Matrícula únicos após várias tentativas')
	} catch (err) {
		const message = (err as Error).message;
		if (/cpf.*\s*invalid|cpf.*inválido/i.test(message) || (err instanceof z.ZodError && err.errors?.some(e => /cpf/i.test(e.path?.join?.('') ?? '') && /11 dígitos/.test(e.message)))) {
			return NextResponse.json({ ok: false, error: 'CPF inválido' }, { status: 400 });
		}
		if (/matricula|usu_matricula|IX_USUARIO_MATRICULA|unique.*matricula|duplicat.*matricula/i.test(message)) {
			return NextResponse.json({ ok: false, error: 'Matrícula já cadastrada' }, { status: 409 });
		}
		if (/email|usu_email|IX_USUARIO_EMAIL|unique.*email|duplicat.*email/i.test(message)) {
			return NextResponse.json({ ok: false, error: 'Email já cadastrado' }, { status: 409 });
		}
		if (/cpf|usu_cpf|IX_USUARIO_CPF|unique.*cpf|duplicat.*cpf/i.test(message)) {
			return NextResponse.json({ ok: false, error: 'CPF já cadastrado' }, { status: 409 });
		}
		const conflict = /UNIQUE|duplicate|unique key|IX_|UQ_/i.test(message);
		return NextResponse.json({ ok: false, error: message }, { status: conflict ? 409 : 400 });
	}
}

const updateSchema = z.object({
	usuarioId: z.number().int().positive(),
	nome: z.string().min(2).max(150).optional(),
	curso: z.union([z.string(), z.number().int().nonnegative()]).optional(),
	periodo: z.union([z.string(), z.number().int().positive()]).optional(),
})

export async function PUT(req: Request) {
	let parsed: z.infer<typeof updateSchema>
	try {
		const json = await req.json()
		parsed = updateSchema.parse(json)
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json({ ok: false, error: 'Dados inválidos', issues: err.flatten() }, { status: 422 })
		}
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
	}

	try {
		const pool = await getPool()
		const request = pool.request()

		request.input('USU_ID', parsed.usuarioId)
		
		const updates: string[] = []
		const params: { [key: string]: any } = {}

		if (parsed.nome !== undefined) {
			request.input('USU_NOME', parsed.nome)
			updates.push('USU_NOME = @USU_NOME')
		}

		if (parsed.curso !== undefined && parsed.curso !== null) {
			const cursoId = typeof parsed.curso === 'string' ? Number(parsed.curso) : parsed.curso
			request.input('USU_IDCURSO', cursoId)
			updates.push('USU_IDCURSO = @USU_IDCURSO')
		}

		if (parsed.periodo !== undefined && parsed.periodo !== null) {
			const periodoId = typeof parsed.periodo === 'string' ? Number(parsed.periodo) : parsed.periodo
			request.input('USU_IDPERIODO', periodoId)
			updates.push('USU_IDPERIODO = @USU_IDPERIODO')
		}

		if (updates.length === 0) {
			return NextResponse.json({ ok: false, error: 'Nenhum campo para atualizar' }, { status: 400 })
		}

		const updateSql = `
			UPDATE USUARIO
			SET ${updates.join(', ')}
			WHERE USU_ID = @USU_ID
		`

		await request.query(updateSql)

		// Buscar dados atualizados com curso e período
		const selectReq = pool.request()
		selectReq.input('USU_ID', parsed.usuarioId)
		const userRes = await selectReq.query(`
			SELECT 
				USU_ID, 
				USU_NOME, 
				USU_EMAIL, 
				USU_ATIVO, 
				USU_IDPERMISSAO,
				USU_IDCURSO,
				USU_IDPERIODO,
				USU_AVALIACAO
			FROM USUARIO 
			WHERE USU_ID = @USU_ID
		`)
		const user = userRes.recordset[0]

		// Buscar descrição do curso e período se existirem
		if (user.USU_IDCURSO !== null && user.USU_IDCURSO !== undefined) {
			const cursoRes = await selectReq.query(`
				SELECT CUR_DESC FROM CURSO WHERE CUR_ID = ${user.USU_IDCURSO}
			`)
			user.USU_CURSO_DESC = cursoRes.recordset[0]?.CUR_DESC || null
		}

		if (user.USU_IDPERIODO !== null && user.USU_IDPERIODO !== undefined) {
			const periodoRes = await selectReq.query(`
				SELECT PER_DESCRICAO FROM PERIODO WHERE PER_ID = ${user.USU_IDPERIODO}
			`)
			user.USU_PERIODO_DESC = periodoRes.recordset[0]?.PER_DESCRICAO || null
		}

		return NextResponse.json({ ok: true, user })
	} catch (err) {
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}
