import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import crypto from 'crypto'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, senhaAtual, senhaNova } = body

    console.log('[SENHA] Requisição recebida:', { id, temSenhaAtual: !!senhaAtual, temSenhaNova: !!senhaNova })

    if (!id || !senhaAtual || !senhaNova) {
      return NextResponse.json(
        { ok: false, error: 'ID, senha atual e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // Buscar o hash da senha atual do usuário
    const usuarioQuery = await pool.query(
      'SELECT usu_senha FROM usuario WHERE usu_id = $1',
      [id]
    )

    console.log('[SENHA] Usuário encontrado:', usuarioQuery.rows.length > 0)

    if (usuarioQuery.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const senhaHashAtual = usuarioQuery.rows[0].usu_senha

    console.log('[SENHA] Tipo do hash no banco:', typeof senhaHashAtual, 'É Buffer?', Buffer.isBuffer(senhaHashAtual))

    // Verificar se a senha atual está correta
    // Usar SHA512 como na autenticação
    const senhaAtualHash = crypto
      .createHash('sha512')
      .update(senhaAtual)
      .digest('hex')

    console.log('[SENHA] Hash gerado da senha atual (hex)')

    // Garantir que o hash do banco esteja em formato hex string
    let storedHash: string
    if (Buffer.isBuffer(senhaHashAtual)) {
      storedHash = senhaHashAtual.toString('hex')
    } else if (typeof senhaHashAtual === 'string') {
      storedHash = senhaHashAtual
    } else {
      storedHash = Buffer.from(senhaHashAtual).toString('hex')
    }

    const senhaCorreta = senhaAtualHash === storedHash

    console.log('[SENHA] Senha correta?', senhaCorreta)

    if (!senhaCorreta) {
      return NextResponse.json(
        { ok: false, error: 'Senha atual incorreta' },
        { status: 401 }
      )
    }

    // Criar hash da nova senha (SHA512 em hex)
    const senhaNovaHashHex = crypto
      .createHash('sha512')
      .update(senhaNova)
      .digest('hex')

    // Converter para Buffer BYTEA para armazenar no banco
    const senhaNovaHash = Buffer.from(senhaNovaHashHex, 'hex')

    // Atualizar a senha
    await pool.query(
      'UPDATE usuario SET usu_senha = $1 WHERE usu_id = $2',
      [senhaNovaHash, id]
    )

    console.log('[SENHA] Senha atualizada com sucesso')

    return NextResponse.json({
      ok: true,
      message: 'Senha alterada com sucesso'
    })

  } catch (error) {
    console.error('[SENHA] Erro ao alterar senha:', error)
    console.error('[SENHA] Stack:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { ok: false, error: 'Erro ao alterar senha', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
