import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { mapColumnsToUpperCase } from '@/lib/pg-helpers'
import { z } from 'zod'
import crypto from 'crypto'

// GET - Buscar todos os usuários
export async function GET(req: NextRequest) {
  try {
    const pool = await getPool()

    const query = `
      SELECT 
        u.usu_id,
        u.usu_matricula,
        u.usu_nome,
        u.usu_email,
        u.usu_idpermissao,
        u.usu_idcurso,
        u.usu_idperiodo,
        u.usu_ativo,
        c.cur_desc,
        p.per_descricao,
        pu.pu_nomepermissao
      FROM usuario u
      LEFT JOIN curso c ON u.usu_idcurso = c.cur_id
      LEFT JOIN periodo p ON u.usu_idperiodo = p.per_id
      LEFT JOIN permissaousuario pu ON u.usu_idpermissao = pu.pu_idpermissao
      ORDER BY u.usu_nome
    `

    const result = await pool.query(query)

    return NextResponse.json({
      ok: true,
      usuarios: result.rows.map(mapColumnsToUpperCase),
      total: result.rows.length
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
	idPermissao: z.number().int().positive().default(1),
	matricula: z.number().int().positive().optional(),
	nome: z.string().min(2).max(150),
	cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos').optional(),
	senha: z.string().min(6),
	email: z.string().email().max(100),
	// USU_ATIVO: true = ativo, false = inativo. Padrão: true (ativo)
	ativo: z.boolean().optional().default(true),
	curso: z.union([z.string(), z.number().int().nonnegative()]).optional(),
	periodo: z.union([z.string(), z.number().int().positive()]).optional(),
})

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
			const matriculaToUse = parsed.matricula ?? null
			const cpfToUse = parsed.cpf ?? null

			const whereClauses: string[] = []
			const checkValues: any[] = []
			let paramIdx = 1

			whereClauses.push(`usu_email = $${paramIdx}`)
			checkValues.push(parsed.email)
			paramIdx++

			if (matriculaToUse !== null) {
				whereClauses.push(`usu_matricula = $${paramIdx}`)
				checkValues.push(matriculaToUse)
				paramIdx++
			}

			if (cpfToUse !== null) {
				whereClauses.push(`usu_cpf = $${paramIdx}`)
				checkValues.push(cpfToUse)
				paramIdx++
			}

			const checkSql = `
			SELECT usu_email, usu_matricula, usu_cpf
			FROM usuario
			WHERE ${whereClauses.join(' OR ')}
			`

			const checkRes = await pool.query(checkSql, checkValues)
			if (checkRes.rows.length > 0) {
				const conflicts: any = {
					email: false,
					matricula: false,
					cpf: false
				}
				for (const row of checkRes.rows) {
					if (row.usu_email === parsed.email) conflicts.email = true
					if (matriculaToUse !== null && row.usu_matricula === matriculaToUse) conflicts.matricula = true
					if (cpfToUse !== null && row.usu_cpf === cpfToUse) conflicts.cpf = true
				}
				return NextResponse.json({ ok: false, error: 'Conflitos de dados', conflicts }, { status: 409 })
			}
		} catch (preErr) {
			// Se a checagem falhar, segue o fluxo normal e será tratado mais abaixo se houver erro
		}

		let tentativa = 0
		while (tentativa < 5) {
			try {
				const pool = await getPool()

				const matricula = parsed.matricula ?? generateMatricula()
				const cpf = parsed.cpf ?? generateRandomCpf()
				const ativo = parsed.ativo ?? true

				const insertFields: string[] = [
					'usu_idpermissao',
					'usu_matricula',
					'usu_nome',
					'usu_cpf',
					'usu_senha',
					'usu_email',
					'usu_ativo'
				]
				const insertValues: any[] = [
					parsed.idPermissao,
					matricula,
					parsed.nome,
					cpf,
					Buffer.from(senhaHash, 'hex'),
					parsed.email,
					ativo
				]

				if (parsed.curso !== undefined && parsed.curso !== null) {
					const cursoId = typeof parsed.curso === 'string' ? Number(parsed.curso) : parsed.curso
					if (cursoId > 0) {
						insertFields.push('usu_idcurso')
						insertValues.push(cursoId)
					}
				}

				if (parsed.periodo !== undefined && parsed.periodo !== null) {
					const periodoId = typeof parsed.periodo === 'string' ? Number(parsed.periodo) : parsed.periodo
					if (periodoId > 0) {
						insertFields.push('usu_idperiodo')
						insertValues.push(periodoId)
					}
				}

				const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ')
				const insertSql = `
				INSERT INTO usuario (
					${insertFields.join(', ')}
				)
				VALUES (${placeholders})
				RETURNING usu_id
				`

				const result = await pool.query(insertSql, insertValues)
				const newId = result.rows[0]?.usu_id

				return NextResponse.json({ ok: true, id: newId })
			} catch (e) {
				const msg = (e as Error & { code?: string }).message || ''
				const code = (e as any)?.code
				if (/unique|duplicate/i.test(msg) || code === '23505') {
					tentativa++
					continue
				}
				if (code === 'ESOCKET' || /ECONN|ETIMEOUT|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
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
		const conflict = /unique|duplicate/i.test(message) || (err as any)?.code === '23505';
		return NextResponse.json({ ok: false, error: message }, { status: conflict ? 409 : 400 });
	}
}

const updateSchema = z.object({
	usuarioId: z.number().int().positive(),
	id: z.number().int().positive().optional(), // Aceitar também como 'id'
	nome: z.string().min(2).max(150).optional(),
	curso: z.union([z.string(), z.number().int().nonnegative()]).optional(),
	periodo: z.union([z.string(), z.number().int().positive()]).optional(),
	idPermissao: z.number().int().positive().optional(),
})

export async function PUT(req: Request) {
	let parsed: z.infer<typeof updateSchema>
	try {
		const json = await req.json()
		// Aceitar 'id' como alias de 'usuarioId'
		if (json.id && !json.usuarioId) {
			json.usuarioId = json.id
		}
		parsed = updateSchema.parse(json)
	} catch (err) {
		if (err instanceof z.ZodError) {
			return NextResponse.json({ ok: false, error: 'Dados inválidos', issues: err.flatten() }, { status: 422 })
		}
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
	}

	try {
		const pool = await getPool()
		
		const updates: string[] = []
		const values: any[] = []
		let paramCount = 1

		if (parsed.nome !== undefined) {
			updates.push(`usu_nome = $${paramCount}`)
			values.push(parsed.nome)
			paramCount++
		}

		if (parsed.idPermissao !== undefined) {
			updates.push(`usu_idpermissao = $${paramCount}`)
			values.push(parsed.idPermissao)
			paramCount++
		}

		if (parsed.curso !== undefined && parsed.curso !== null) {
			const cursoId = typeof parsed.curso === 'string' ? Number(parsed.curso) : parsed.curso
			if (cursoId > 0) {
				updates.push(`usu_idcurso = $${paramCount}`)
				values.push(cursoId)
				paramCount++
			}
		}

		if (parsed.periodo !== undefined && parsed.periodo !== null) {
			const periodoId = typeof parsed.periodo === 'string' ? Number(parsed.periodo) : parsed.periodo
			if (periodoId > 0) {
				updates.push(`usu_idperiodo = $${paramCount}`)
				values.push(periodoId)
				paramCount++
			}
		}

		if (updates.length === 0) {
			return NextResponse.json({ ok: false, error: 'Nenhum campo para atualizar' }, { status: 400 })
		}

		values.push(parsed.usuarioId)
		const updateSql = `
			UPDATE usuario
			SET ${updates.join(', ')}
			WHERE usu_id = $${paramCount}
		`

		await pool.query(updateSql, values)

		// Buscar dados atualizados com curso e período
		const userRes = await pool.query(`
			SELECT 
				usu_id, 
				usu_nome, 
				usu_email, 
				usu_ativo, 
				usu_idpermissao,
				usu_idcurso,
				usu_idperiodo,
				usu_avaliacao
			FROM usuario 
			WHERE usu_id = $1
		`, [parsed.usuarioId])
		const user = mapColumnsToUpperCase(userRes.rows[0])

		// Buscar descrição do curso e período se existirem
		if (user.USU_IDCURSO !== null && user.USU_IDCURSO !== undefined) {
			const cursoRes = await pool.query(`
				SELECT cur_desc FROM curso WHERE cur_id = $1
			`, [user.USU_IDCURSO])
			user.USU_CURSO_DESC = cursoRes.rows[0]?.cur_desc || null
		}

		if (user.USU_IDPERIODO !== null && user.USU_IDPERIODO !== undefined) {
			const periodoRes = await pool.query(`
				SELECT per_descricao FROM periodo WHERE per_id = $1
			`, [user.USU_IDPERIODO])
			user.USU_PERIODO_DESC = periodoRes.rows[0]?.per_descricao || null
		}

		return NextResponse.json({ ok: true, user })
	} catch (err) {
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}

// DELETE - Excluir usuário
export async function DELETE(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const id = searchParams.get('id')

		if (!id) {
			return NextResponse.json(
				{ ok: false, error: 'ID do usuário é obrigatório.' },
				{ status: 400 }
			)
		}

		const pool = await getPool()
		const userId = parseInt(id)

		// Verificar se o usuário existe
		const checkUser = await pool.query(
			'SELECT usu_id FROM usuario WHERE usu_id = $1',
			[userId]
		)

		if (checkUser.rows.length === 0) {
			return NextResponse.json(
				{ ok: false, error: 'Usuário não encontrado.' },
				{ status: 404 }
			)
		}

		// Verificar se há dúvidas vinculadas
		const checkDuvidas = await pool.query(
			'SELECT COUNT(*) as total FROM duvida WHERE duv_idusuario = $1',
			[userId]
		)

		if (parseInt(checkDuvidas.rows[0].total) > 0) {
			return NextResponse.json(
				{ ok: false, error: 'Não é possível excluir um usuário que possui dúvidas cadastradas.' },
				{ status: 409 }
			)
		}

		// Verificar se há respostas vinculadas
		const checkRespostas = await pool.query(
			'SELECT COUNT(*) as total FROM resposta WHERE res_idusuario = $1',
			[userId]
		)

		if (parseInt(checkRespostas.rows[0].total) > 0) {
			return NextResponse.json(
				{ ok: false, error: 'Não é possível excluir um usuário que possui respostas cadastradas.' },
				{ status: 409 }
			)
		}

		// Excluir avaliações de respostas feitas pelo usuário
		await pool.query(
			'DELETE FROM avaliacaoresposta WHERE ava_idusuario = $1',
			[userId]
		)

		// Excluir o usuário
		await pool.query(
			'DELETE FROM usuario WHERE usu_id = $1',
			[userId]
		)

		return NextResponse.json({
			ok: true,
			message: 'Usuário excluído com sucesso!'
		})
	} catch (err) {
		console.error('Erro ao excluir usuário:', err)
		return NextResponse.json(
			{ ok: false, error: (err as Error).message },
			{ status: 500 }
		)
	}
}
