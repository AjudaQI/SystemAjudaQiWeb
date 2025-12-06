import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json()
    if (!email || !senha) {
      return NextResponse.json({ ok: false, error: 'E-mail e senha obrigatórios.' }, { status: 400 })
    }

    const pool = await getPool()
    const requestDb = pool.request()
    requestDb.input('USU_EMAIL', email)
    const resUser = await requestDb.query(`
      SELECT 
        USU_ID, 
        USU_NOME, 
        USU_EMAIL, 
        USU_SENHA, 
        USU_ATIVO, 
        USU_IDPERMISSAO,
        USU_IDCURSO,
        USU_IDPERIODO,
        USU_AVALIACAO
      FROM USUARIO 
      WHERE USU_EMAIL = @USU_EMAIL
    `)
    const user = resUser.recordset[0]
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuário ou senha inválidos.' }, { status: 401 })
    }

    // Buscar descrição do curso e período se existirem
    if (user.USU_IDCURSO !== null && user.USU_IDCURSO !== undefined) {
      const cursoRes = await requestDb.query(`
        SELECT CUR_DESC FROM CURSO WHERE CUR_ID = ${user.USU_IDCURSO}
      `)
      user.USU_CURSO_DESC = cursoRes.recordset[0]?.CUR_DESC || null
    }

    if (user.USU_IDPERIODO !== null && user.USU_IDPERIODO !== undefined) {
      const periodoRes = await requestDb.query(`
        SELECT PER_DESCRICAO FROM PERIODO WHERE PER_ID = ${user.USU_IDPERIODO}
      `)
      user.USU_PERIODO_DESC = periodoRes.recordset[0]?.PER_DESCRICAO || null
    }

    const hash = crypto.createHash('sha512').update(senha).digest()
    if (!user.USU_SENHA || !Buffer.compare(Buffer.from(user.USU_SENHA), hash) === 0) {
      return NextResponse.json({ ok: false, error: 'Usuário ou senha inválidos.' }, { status: 401 })
    }
    if (user.USU_ATIVO !== 1 && user.USU_ATIVO !== true) {
      return NextResponse.json({ ok: false, error: 'Usuário inativo.' }, { status: 403 })
    }
    // Nunca envie USU_SENHA para o front
    delete user.USU_SENHA
    return NextResponse.json({ ok: true, user })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
