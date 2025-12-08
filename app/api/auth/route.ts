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
    const resUser = await pool.query(`
      SELECT 
        usu_id, 
        usu_nome, 
        usu_email, 
        usu_matricula,
        usu_senha, 
        usu_ativo, 
        usu_idpermissao,
        usu_idcurso,
        usu_idperiodo,
        usu_avaliacao
      FROM USUARIO 
      WHERE usu_email = $1
    `, [email])
    
    const userRow = resUser.rows[0]
    if (!userRow) {
      return NextResponse.json({ ok: false, error: 'Usuário ou senha inválidos.' }, { status: 401 })
    }

    // Converter nomes de colunas para maiúsculas (compatibilidade)
    const user: any = {
      USU_ID: userRow.usu_id,
      USU_NOME: userRow.usu_nome,
      USU_EMAIL: userRow.usu_email,
      USU_MATRICULA: userRow.usu_matricula,
      USU_SENHA: userRow.usu_senha,
      USU_ATIVO: userRow.usu_ativo,
      USU_IDPERMISSAO: userRow.usu_idpermissao,
      USU_IDCURSO: userRow.usu_idcurso,
      USU_IDPERIODO: userRow.usu_idperiodo,
      USU_AVALIACAO: userRow.usu_avaliacao
    }

    // Buscar descrição do curso e período se existirem
    if (user.USU_IDCURSO !== null && user.USU_IDCURSO !== undefined) {
      const cursoRes = await pool.query(`
        SELECT cur_desc FROM CURSO WHERE cur_id = $1
      `, [user.USU_IDCURSO])
      user.USU_CURSO_DESC = cursoRes.rows[0]?.cur_desc || null
    }

    if (user.USU_IDPERIODO !== null && user.USU_IDPERIODO !== undefined) {
      const periodoRes = await pool.query(`
        SELECT per_descricao FROM PERIODO WHERE per_id = $1
      `, [user.USU_IDPERIODO])
      user.USU_PERIODO_DESC = periodoRes.rows[0]?.per_descricao || null
    }

    // Gerar hash da senha fornecida no mesmo formato usado no cadastro (hex)
    const hash = crypto.createHash('sha512').update(senha).digest('hex')
    
    // USU_SENHA é armazenado como BYTEA no banco PostgreSQL
    let storedHash: string
    if (!user.USU_SENHA) {
      return NextResponse.json({ ok: false, error: 'Usuário ou senha inválidos.' }, { status: 401 })
    }
    
    if (user.USU_SENHA instanceof Buffer) {
      storedHash = user.USU_SENHA.toString('hex')
    } else if (typeof user.USU_SENHA === 'string') {
      // Se já vier como string hex, usar diretamente
      storedHash = user.USU_SENHA
    } else {
      // Tentar converter para Buffer e depois para hex
      storedHash = Buffer.from(user.USU_SENHA as any).toString('hex')
    }
    
    // Comparar os hashes em formato hex
    if (hash !== storedHash) {
      return NextResponse.json({ ok: false, error: 'Usuário ou senha inválidos.' }, { status: 401 })
    }
    if (!user.USU_ATIVO) {
      return NextResponse.json({ ok: false, error: 'Usuário inativo.' }, { status: 403 })
    }
    // Nunca envie USU_SENHA para o front
    delete user.USU_SENHA
    return NextResponse.json({ ok: true, user })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
