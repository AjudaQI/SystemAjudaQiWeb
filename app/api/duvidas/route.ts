import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { materiaDesc, periodoNum, titulo, descricao, usuarioId } = await req.json()

    if (!materiaDesc || !periodoNum || !titulo || !descricao || !usuarioId) {
      return NextResponse.json(
        { ok: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // 1. Buscar dados do usuário para obter o curso
    const usuarioRes = await pool.query(`
      SELECT usu_idcurso 
      FROM usuario 
      WHERE usu_id = $1 AND usu_ativo = TRUE
    `, [usuarioId])

    if (!usuarioRes.rows[0]) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      )
    }

    const cursoId = usuarioRes.rows[0].usu_idcurso

    // 2. Buscar PER_ID baseado no número do período
    const periodoNumInt = parseInt(periodoNum)
    
    let periodoId: number
    if (periodoNumInt >= 1 && periodoNumInt <= 12) {
      periodoId = periodoNumInt
    } else {
      const periodoRes = await pool.query(`
        SELECT per_id 
        FROM periodo 
        WHERE per_descricao = $1
      `, [`${periodoNum}º Período`])
      
      if (!periodoRes.rows[0]) {
        return NextResponse.json(
          { ok: false, error: 'Período não encontrado' },
          { status: 404 }
        )
      }
      
      periodoId = periodoRes.rows[0].per_id
    }
    
    // Verificar se o período existe
    const periodoCheck = await pool.query(`
      SELECT per_id
      FROM periodo 
      WHERE per_id = $1
    `, [periodoId])
    
    if (!periodoCheck.rows[0]) {
      return NextResponse.json(
        { ok: false, error: 'Período não encontrado' },
        { status: 404 }
      )
    }

    // 3. Buscar MAT_ID baseado na descrição da matéria e período
    console.log('Buscando matéria:', { materiaDesc, periodoId, cursoId })
    
    const materiaRes = await pool.query(`
      SELECT mat_id, mat_desc, mat_idperiodo, mat_idcurso
      FROM materia 
      WHERE mat_desc = $1 
        AND mat_idperiodo = $2
    `, [materiaDesc, periodoId])
    
    console.log('Matérias encontradas:', materiaRes.rows.length, materiaRes.rows)

    let materiaId: number
    
    if (!materiaRes.rows[0]) {
      const materiaRes2 = await pool.query(`
        SELECT mat_id 
        FROM materia 
        WHERE mat_desc LIKE $1 
          AND mat_idperiodo = $2
      `, [materiaDesc, periodoId])
      
      if (!materiaRes2.rows[0]) {
        return NextResponse.json(
          { ok: false, error: `Matéria "${materiaDesc}" não encontrada para o período ${periodoNum} (PER_ID: ${periodoId})` },
          { status: 404 }
        )
      }
      
      materiaId = materiaRes2.rows[0].mat_id
    } else {
      if (materiaRes.rows.length > 1 && cursoId) {
        const materiaDoCurso = materiaRes.rows.find(m => m.mat_idcurso === cursoId)
        materiaId = materiaDoCurso ? materiaDoCurso.mat_id : materiaRes.rows[0].mat_id
      } else {
        materiaId = materiaRes.rows[0].mat_id
      }
    }

    // 4. Inserir a dúvida
    const insertRes = await pool.query(`
      INSERT INTO duvida (
        duv_idusuario,
        duv_idmateria,
        duv_titulo,
        duv_descricao,
        duv_resolvida
      )
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING duv_idduvida
    `, [usuarioId, materiaId, titulo, descricao])

    const duvidaId = insertRes.rows[0]?.duv_idduvida

    return NextResponse.json({
      ok: true,
      id: duvidaId,
      message: 'Dúvida criada com sucesso'
    })
  } catch (err) {
    console.error('Erro ao criar dúvida:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const pool = await getPool()

    const duvidas = await pool.query(`
      SELECT 
        d.duv_idduvida,
        d.duv_titulo,
        d.duv_descricao,
        d.duv_dataduvida,
        d.duv_resolvida,
        d.duv_idusuario,
        d.duv_idmateria,
        m.mat_desc,
        pm.per_descricao AS materia_periodo_desc,
        cm.cur_desc AS materia_curso_desc,
        u.usu_nome,
        u.usu_email,
        cu.cur_desc AS usuario_curso_desc,
        pu.per_descricao AS usuario_periodo_desc
      FROM duvida d
      INNER JOIN materia m ON d.duv_idmateria = m.mat_id
      INNER JOIN periodo pm ON m.mat_idperiodo = pm.per_id
      LEFT JOIN curso cm ON m.mat_idcurso = cm.cur_id
      INNER JOIN usuario u ON d.duv_idusuario = u.usu_id
      LEFT JOIN curso cu ON u.usu_idcurso = cu.cur_id
      LEFT JOIN periodo pu ON u.usu_idperiodo = pu.per_id
      WHERE u.usu_ativo = TRUE
      ORDER BY d.duv_dataduvida DESC
    `)

    return NextResponse.json({
      ok: true,
      duvidas: duvidas.rows.map(row => ({
        DUV_IDDUVIDA: row.duv_idduvida,
        DUV_TITULO: row.duv_titulo,
        DUV_DESCRICAO: row.duv_descricao,
        DUV_DATADUVIDA: row.duv_dataduvida,
        DUV_RESOLVIDA: row.duv_resolvida,
        DUV_IDUSUARIO: row.duv_idusuario,
        DUV_IDMATERIA: row.duv_idmateria,
        MAT_DESC: row.mat_desc,
        MATERIA_PERIODO_DESC: row.materia_periodo_desc,
        MATERIA_CURSO_DESC: row.materia_curso_desc,
        USU_NOME: row.usu_nome,
        USU_EMAIL: row.usu_email,
        USUARIO_CURSO_DESC: row.usuario_curso_desc,
        USUARIO_PERIODO_DESC: row.usuario_periodo_desc
      }))
    })
  } catch (err) {
    console.error('Erro ao buscar dúvidas:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { duvidaId, usuarioId, materiaDesc, periodoNum, titulo, descricao } = await req.json()

    if (!duvidaId || !usuarioId || !materiaDesc || !periodoNum || !titulo || !descricao) {
      return NextResponse.json(
        { ok: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // Verificar se a dúvida existe e se pertence ao usuário
    const checkRes = await pool.query(`
      SELECT duv_idduvida, duv_idusuario, duv_idmateria
      FROM duvida
      WHERE duv_idduvida = $1
    `, [duvidaId])

    if (!checkRes.rows[0]) {
      return NextResponse.json(
        { ok: false, error: 'Dúvida não encontrada' },
        { status: 404 }
      )
    }

    const duvidaUsuarioId = typeof checkRes.rows[0].duv_idusuario === 'string'
      ? parseInt(checkRes.rows[0].duv_idusuario, 10)
      : Number(checkRes.rows[0].duv_idusuario)
    
    const usuarioIdNumber = typeof usuarioId === 'string' ? parseInt(usuarioId, 10) : Number(usuarioId)

    if (duvidaUsuarioId !== usuarioIdNumber) {
      return NextResponse.json(
        { ok: false, error: 'Você não tem permissão para editar esta dúvida' },
        { status: 403 }
      )
    }

    // Buscar dados do usuário para obter o curso
    const usuarioRes = await pool.query(`
      SELECT usu_idcurso 
      FROM usuario 
      WHERE usu_id = $1 AND usu_ativo = TRUE
    `, [usuarioId])

    if (!usuarioRes.rows[0]) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      )
    }

    const cursoId = usuarioRes.rows[0].usu_idcurso

    // 2. Buscar PER_ID baseado no número do período
    const periodoNumInt = parseInt(periodoNum)
    
    let periodoId: number
    if (periodoNumInt >= 1 && periodoNumInt <= 12) {
      periodoId = periodoNumInt
    } else {
      const periodoRes = await pool.query(`
        SELECT per_id 
        FROM periodo 
        WHERE per_descricao = $1
      `, [`${periodoNum}º Período`])
      
      if (!periodoRes.rows[0]) {
        return NextResponse.json(
          { ok: false, error: 'Período não encontrado' },
          { status: 404 }
        )
      }
      
      periodoId = periodoRes.rows[0].per_id
    }

    // Buscar MAT_ID baseado na descrição da matéria e período
    const materiaRes = await pool.query(`
      SELECT mat_id, mat_desc, mat_idperiodo, mat_idcurso
      FROM materia 
      WHERE mat_desc = $1 
        AND mat_idperiodo = $2
    `, [materiaDesc, periodoId])

    let materiaId: number
    
    if (!materiaRes.rows[0]) {
      const materiaRes2 = await pool.query(`
        SELECT mat_id 
        FROM materia 
        WHERE mat_desc LIKE $1 
          AND mat_idperiodo = $2
      `, [materiaDesc, periodoId])
      
      if (!materiaRes2.rows[0]) {
        return NextResponse.json(
          { ok: false, error: `Matéria "${materiaDesc}" não encontrada para o período ${periodoNum}` },
          { status: 404 }
        )
      }
      
      materiaId = materiaRes2.rows[0].mat_id
    } else {
      if (materiaRes.rows.length > 1 && cursoId) {
        const materiaDoCurso = materiaRes.rows.find(m => m.mat_idcurso === cursoId)
        materiaId = materiaDoCurso ? materiaDoCurso.mat_id : materiaRes.rows[0].mat_id
      } else {
        materiaId = materiaRes.rows[0].mat_id
      }
    }

    // Atualizar a dúvida
    await pool.query(`
      UPDATE duvida
      SET duv_idmateria = $1,
          duv_titulo = $2,
          duv_descricao = $3
      WHERE duv_idduvida = $4
    `, [materiaId, titulo, descricao, duvidaId])

    return NextResponse.json({
      ok: true,
      message: 'Dúvida atualizada com sucesso'
    })
  } catch (err) {
    console.error('Erro ao atualizar dúvida:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { duvidaId, usuarioId } = await req.json()

    if (!duvidaId || !usuarioId) {
      return NextResponse.json(
        { ok: false, error: 'duvidaId e usuarioId são obrigatórios' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // Buscar dados da dúvida e do usuário que está deletando
    const checkRes = await pool.query(`
      SELECT 
        d.duv_idduvida, 
        d.duv_idusuario,
        d.duv_titulo,
        d.duv_descricao,
        u_autor.usu_nome as autor_nome,
        u_deletou.usu_id,
        u_deletou.usu_nome,
        u_deletou.usu_email,
        u_deletou.usu_matricula,
        u_deletou.usu_idpermissao
      FROM duvida d
      LEFT JOIN usuario u_autor ON d.duv_idusuario = u_autor.usu_id
      LEFT JOIN usuario u_deletou ON u_deletou.usu_id = $2
      WHERE d.duv_idduvida = $1
    `, [duvidaId, usuarioId])

    if (!checkRes.rows[0]) {
      return NextResponse.json(
        { ok: false, error: 'Dúvida não encontrada' },
        { status: 404 }
      )
    }

    const duvida = checkRes.rows[0]

    // Verificar se a dúvida pertence ao usuário OU se é admin (permissão 2)
    const duvidaUsuarioId = typeof duvida.duv_idusuario === 'string'
      ? parseInt(duvida.duv_idusuario, 10)
      : Number(duvida.duv_idusuario)
    
    const usuarioIdNumber = typeof usuarioId === 'string' ? parseInt(usuarioId, 10) : Number(usuarioId)
    const usuarioPermissao = duvida.usu_idpermissao

    const isAdmin = usuarioPermissao === 2 || usuarioPermissao === '2'
    const isOwner = duvidaUsuarioId === usuarioIdNumber

    // Log para debug
    console.log('DEBUG DELETE - Verificação de permissão:', {
      duvidaId,
      usuarioId: usuarioIdNumber,
      duvidaUsuarioId,
      usuarioPermissao,
      isAdmin,
      isOwner,
      temPermissao: isOwner || isAdmin
    })

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Você não tem permissão para excluir esta dúvida' },
        { status: 403 }
      )
    }

    // Registrar log antes de excluir
    await pool.query(`
      INSERT INTO logexclusaoduvida (
        log_idduvida,
        log_titulo,
        log_descricao,
        log_idusuario_autor,
        log_nome_autor,
        log_idusuario_deletou,
        log_nome_deletou,
        log_email_deletou,
        log_matricula_deletou
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      duvidaId,
      duvida.duv_titulo,
      duvida.duv_descricao,
      duvida.duv_idusuario,
      duvida.autor_nome,
      usuarioIdNumber,
      duvida.usu_nome,
      duvida.usu_email,
      duvida.usu_matricula
    ])

    // Excluir a dúvida (as respostas e comentários serão excluídos automaticamente devido ao CASCADE)
    await pool.query(`
      DELETE FROM duvida
      WHERE duv_idduvida = $1
    `, [duvidaId])

    console.log(`Dúvida ${duvidaId} excluída por ${duvida.usu_nome} (${duvida.usu_email}) - Matrícula: ${duvida.usu_matricula || 'N/A'}`)

    return NextResponse.json({
      ok: true,
      message: 'Dúvida excluída com sucesso'
    })
  } catch (err) {
    console.error('Erro ao excluir dúvida:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

