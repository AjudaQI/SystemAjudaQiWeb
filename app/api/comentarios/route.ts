import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

// GET - Buscar comentários de uma resposta
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const idResposta = searchParams.get('idResposta')

    if (!idResposta) {
      return NextResponse.json(
        { ok: false, error: 'ID da resposta é obrigatório' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    const query = `
      SELECT 
        c.com_idcomentario,
        c.com_idresposta,
        c.com_idusuario,
        c.com_texto,
        c.com_datacomentario,
        u.usu_nome,
        u.usu_idpermissao
      FROM comentario c
      INNER JOIN usuario u ON c.com_idusuario = u.usu_id
      WHERE c.com_idresposta = $1
      ORDER BY c.com_datacomentario ASC
    `

    const result = await pool.query(query, [idResposta])

    const comentarios = result.rows.map(row => ({
      COM_IDCOMENTARIO: row.com_idcomentario,
      COM_IDRESPOSTA: row.com_idresposta,
      COM_IDUSUARIO: row.com_idusuario,
      COM_TEXTO: row.com_texto,
      COM_DATACOMENTARIO: row.com_datacomentario,
      USU_NOME: row.usu_nome,
      USU_IDPERMISSAO: row.usu_idpermissao
    }))

    return NextResponse.json({
      ok: true,
      comentarios,
      total: comentarios.length
    })

  } catch (error) {
    console.error('Erro ao buscar comentários:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar comentários' },
      { status: 500 }
    )
  }
}

// POST - Criar novo comentário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { idResposta, idUsuario, texto } = body

    if (!idResposta || !idUsuario || !texto) {
      return NextResponse.json(
        { ok: false, error: 'ID da resposta, ID do usuário e texto são obrigatórios' },
        { status: 400 }
      )
    }

    if (texto.trim().length < 1) {
      return NextResponse.json(
        { ok: false, error: 'Comentário não pode estar vazio' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // Verificar se a resposta existe
    const respostaCheck = await pool.query(
      'SELECT res_idresposta FROM resposta WHERE res_idresposta = $1',
      [idResposta]
    )

    if (respostaCheck.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Resposta não encontrada' },
        { status: 404 }
      )
    }

    // Inserir comentário
    const insertQuery = `
      INSERT INTO comentario (
        com_idresposta,
        com_idusuario,
        com_texto
      ) VALUES ($1, $2, $3)
      RETURNING 
        com_idcomentario,
        com_idresposta,
        com_idusuario,
        com_texto,
        com_datacomentario
    `

    const result = await pool.query(insertQuery, [
      idResposta,
      idUsuario,
      texto.trim()
    ])

    const comentario = result.rows[0]

    // Buscar nome do usuário
    const userQuery = await pool.query(
      'SELECT usu_nome, usu_idpermissao FROM usuario WHERE usu_id = $1',
      [idUsuario]
    )

    const user = userQuery.rows[0]

    return NextResponse.json({
      ok: true,
      comentario: {
        COM_IDCOMENTARIO: comentario.com_idcomentario,
        COM_IDRESPOSTA: comentario.com_idresposta,
        COM_IDUSUARIO: comentario.com_idusuario,
        COM_TEXTO: comentario.com_texto,
        COM_DATACOMENTARIO: comentario.com_datacomentario,
        USU_NOME: user?.usu_nome,
        USU_IDPERMISSAO: user?.usu_idpermissao
      }
    })

  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao criar comentário' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar comentário
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const idComentario = searchParams.get('id')
    const idUsuario = searchParams.get('idUsuario')

    if (!idComentario || !idUsuario) {
      return NextResponse.json(
        { ok: false, error: 'ID do comentário e ID do usuário são obrigatórios' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // Verificar se o comentário pertence ao usuário ou se é admin
    const comentarioQuery = await pool.query(
      `SELECT c.com_idusuario, u.usu_idpermissao 
       FROM comentario c
       INNER JOIN usuario u ON u.usu_id = $1
       WHERE c.com_idcomentario = $2`,
      [idUsuario, idComentario]
    )

    if (comentarioQuery.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    const comentario = comentarioQuery.rows[0]
    const isOwner = comentario.com_idusuario.toString() === idUsuario
    const isAdmin = comentario.usu_idpermissao === 2

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Sem permissão para deletar este comentário' },
        { status: 403 }
      )
    }

    // Deletar comentário
    await pool.query(
      'DELETE FROM comentario WHERE com_idcomentario = $1',
      [idComentario]
    )

    return NextResponse.json({
      ok: true,
      message: 'Comentário deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar comentário:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao deletar comentário' },
      { status: 500 }
    )
  }
}
