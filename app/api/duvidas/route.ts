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
    const request0 = pool.request()
    request0.input('USU_ID', usuarioId)
    const usuarioRes = await request0.query<{ USU_IDCURSO: number | null }>(`
      SELECT USU_IDCURSO 
      FROM USUARIO 
      WHERE USU_ID = @USU_ID AND USU_ATIVO = 1
    `)

    if (!usuarioRes.recordset[0]) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      )
    }

    const cursoId = usuarioRes.recordset[0].USU_IDCURSO
    // Se o usuário não tiver curso, ainda pode criar dúvida, mas precisa buscar a matéria sem filtro de curso

    // 2. Buscar PER_ID baseado no número do período
    // Mapeamento: períodos 1-10 têm IDs 1-10, período 11 tem ID 15, período 12 tem ID 16
    const request1 = pool.request()
    const periodoNumInt = parseInt(periodoNum)
    
    // Mapear número do período para ID
    let periodoId: number
    if (periodoNumInt === 11) {
      periodoId = 15
    } else if (periodoNumInt === 12) {
      periodoId = 16
    } else if (periodoNumInt >= 1 && periodoNumInt <= 10) {
      periodoId = periodoNumInt
    } else {
      // Se não for um número válido, tentar buscar pela descrição
      request1.input('PER_DESCRICAO', `${periodoNum}º Período`)
      const periodoRes = await request1.query<{ PER_ID: number }>(`
        SELECT PER_ID 
        FROM PERIODO 
        WHERE PER_DESCRICAO = @PER_DESCRICAO
      `)
      
      if (!periodoRes.recordset[0]) {
        return NextResponse.json(
          { ok: false, error: 'Período não encontrado' },
          { status: 404 }
        )
      }
      
      periodoId = periodoRes.recordset[0].PER_ID
    }
    
    // Verificar se o período existe (sem verificar PER_ATIVO, pois todos estão ativos)
    const request1b = pool.request()
    request1b.input('PER_ID', periodoId)
    const periodoRes = await request1b.query<{ PER_ID: number }>(`
      SELECT PER_ID
      FROM PERIODO 
      WHERE PER_ID = @PER_ID
    `)
    
    if (!periodoRes.recordset[0]) {
      return NextResponse.json(
        { ok: false, error: 'Período não encontrado' },
        { status: 404 }
      )
    }

    // 3. Buscar MAT_ID baseado na descrição da matéria e período
    // Primeiro tenta sem filtro de curso, depois com curso se disponível
    const request2 = pool.request()
    request2.input('MAT_DESC', materiaDesc)
    request2.input('MAT_IDPERIODO', periodoId)
    
    console.log('Buscando matéria:', { materiaDesc, periodoId, cursoId })
    
    let materiaQuery = `
      SELECT MAT_ID, MAT_DESC, MAT_IDPERIODO, MAT_IDCURSO
      FROM MATERIA 
      WHERE MAT_DESC = @MAT_DESC 
        AND MAT_IDPERIODO = @MAT_IDPERIODO
    `
    
    // Não filtrar por curso inicialmente - buscar todas as matérias com esse nome e período
    const materiaRes = await request2.query<{ MAT_ID: number, MAT_DESC: string, MAT_IDPERIODO: number, MAT_IDCURSO: number }>(materiaQuery)
    
    console.log('Matérias encontradas:', materiaRes.recordset.length, materiaRes.recordset)

    let materiaId: number
    
    if (!materiaRes.recordset[0]) {
      // Se não encontrou, tentar buscar apenas por descrição e período (sem filtros adicionais)
      const request2b = pool.request()
      request2b.input('MAT_DESC', materiaDesc)
      request2b.input('MAT_IDPERIODO', periodoId)
      
      const materiaRes2 = await request2b.query<{ MAT_ID: number }>(`
        SELECT MAT_ID 
        FROM MATERIA 
        WHERE MAT_DESC LIKE @MAT_DESC 
          AND MAT_IDPERIODO = @MAT_IDPERIODO
      `)
      
      if (!materiaRes2.recordset[0]) {
        return NextResponse.json(
          { ok: false, error: `Matéria "${materiaDesc}" não encontrada para o período ${periodoNum} (PER_ID: ${periodoId})` },
          { status: 404 }
        )
      }
      
      materiaId = materiaRes2.recordset[0].MAT_ID
    } else {
      // Se encontrou múltiplas matérias e o usuário tem curso, preferir a do curso do usuário
      if (materiaRes.recordset.length > 1 && cursoId) {
        const materiaDoCurso = materiaRes.recordset.find(m => m.MAT_IDCURSO === cursoId)
        materiaId = materiaDoCurso ? materiaDoCurso.MAT_ID : materiaRes.recordset[0].MAT_ID
      } else {
        materiaId = materiaRes.recordset[0].MAT_ID
      }
    }

    // 4. Inserir a dúvida
    const request3 = pool.request()
    request3.input('DUV_IDUSUARIO', usuarioId)
    request3.input('DUV_IDMATERIA', materiaId)
    request3.input('DUV_TITULO', titulo)
    request3.input('DUV_DESCRICAO', descricao)

    const insertRes = await request3.query<{ DUV_IDDUVIDA: number }>(`
      INSERT INTO DUVIDA (
        DUV_IDUSUARIO,
        DUV_IDMATERIA,
        DUV_TITULO,
        DUV_DESCRICAO,
        DUV_RESOLVIDA
      )
      OUTPUT INSERTED.DUV_IDDUVIDA
      VALUES (
        @DUV_IDUSUARIO,
        @DUV_IDMATERIA,
        @DUV_TITULO,
        @DUV_DESCRICAO,
        0
      )
    `)

    const duvidaId = insertRes.recordset[0]?.DUV_IDDUVIDA

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
    const request = pool.request()

    const duvidas = await request.query(`
      SELECT 
        D.DUV_IDDUVIDA,
        D.DUV_TITULO,
        D.DUV_DESCRICAO,
        D.DUV_DATADUVIDA,
        D.DUV_RESOLVIDA,
        D.DUV_IDUSUARIO,
        D.DUV_IDMATERIA,
        M.MAT_DESC,
        PM.PER_DESCRICAO AS MATERIA_PERIODO_DESC,
        U.USU_NOME,
        U.USU_EMAIL,
        CU.CUR_DESC AS USUARIO_CURSO_DESC,
        PU.PER_DESCRICAO AS USUARIO_PERIODO_DESC
      FROM DUVIDA D
      INNER JOIN MATERIA M ON D.DUV_IDMATERIA = M.MAT_ID
      INNER JOIN PERIODO PM ON M.MAT_IDPERIODO = PM.PER_ID
      INNER JOIN USUARIO U ON D.DUV_IDUSUARIO = U.USU_ID
      LEFT JOIN CURSO CU ON U.USU_IDCURSO = CU.CUR_ID
      LEFT JOIN PERIODO PU ON U.USU_IDPERIODO = PU.PER_ID
      WHERE U.USU_ATIVO = 1
      ORDER BY D.DUV_DATADUVIDA DESC
    `)

    return NextResponse.json({
      ok: true,
      duvidas: duvidas.recordset
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
    const checkReq = pool.request()
    checkReq.input('DUV_IDDUVIDA', duvidaId)
    const checkRes = await checkReq.query<{
      DUV_IDDUVIDA: number
      DUV_IDUSUARIO: number
      DUV_IDMATERIA: number
    }>(`
      SELECT DUV_IDDUVIDA, DUV_IDUSUARIO, DUV_IDMATERIA
      FROM DUVIDA
      WHERE DUV_IDDUVIDA = @DUV_IDDUVIDA
    `)

    if (!checkRes.recordset[0]) {
      return NextResponse.json(
        { ok: false, error: 'Dúvida não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a dúvida pertence ao usuário
    const duvidaUsuarioId = typeof checkRes.recordset[0].DUV_IDUSUARIO === 'string'
      ? parseInt(checkRes.recordset[0].DUV_IDUSUARIO, 10)
      : Number(checkRes.recordset[0].DUV_IDUSUARIO)
    
    const usuarioIdNumber = typeof usuarioId === 'string' ? parseInt(usuarioId, 10) : Number(usuarioId)

    if (duvidaUsuarioId !== usuarioIdNumber) {
      return NextResponse.json(
        { ok: false, error: 'Você não tem permissão para editar esta dúvida' },
        { status: 403 }
      )
    }

    // Buscar dados do usuário para obter o curso
    const request0 = pool.request()
    request0.input('USU_ID', usuarioId)
    const usuarioRes = await request0.query<{ USU_IDCURSO: number | null }>(`
      SELECT USU_IDCURSO 
      FROM USUARIO 
      WHERE USU_ID = @USU_ID AND USU_ATIVO = 1
    `)

    if (!usuarioRes.recordset[0]) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      )
    }

    const cursoId = usuarioRes.recordset[0].USU_IDCURSO

    // Buscar PER_ID baseado no número do período
    const request1 = pool.request()
    const periodoNumInt = parseInt(periodoNum)
    
    let periodoId: number
    if (periodoNumInt === 11) {
      periodoId = 15
    } else if (periodoNumInt === 12) {
      periodoId = 16
    } else if (periodoNumInt >= 1 && periodoNumInt <= 10) {
      periodoId = periodoNumInt
    } else {
      request1.input('PER_DESCRICAO', `${periodoNum}º Período`)
      const periodoRes = await request1.query<{ PER_ID: number }>(`
        SELECT PER_ID 
        FROM PERIODO 
        WHERE PER_DESCRICAO = @PER_DESCRICAO
      `)
      
      if (!periodoRes.recordset[0]) {
        return NextResponse.json(
          { ok: false, error: 'Período não encontrado' },
          { status: 404 }
        )
      }
      
      periodoId = periodoRes.recordset[0].PER_ID
    }

    // Buscar MAT_ID baseado na descrição da matéria e período
    const request2 = pool.request()
    request2.input('MAT_DESC', materiaDesc)
    request2.input('MAT_IDPERIODO', periodoId)
    
    const materiaRes = await request2.query<{ MAT_ID: number, MAT_DESC: string, MAT_IDPERIODO: number, MAT_IDCURSO: number }>(`
      SELECT MAT_ID, MAT_DESC, MAT_IDPERIODO, MAT_IDCURSO
      FROM MATERIA 
      WHERE MAT_DESC = @MAT_DESC 
        AND MAT_IDPERIODO = @MAT_IDPERIODO
    `)

    let materiaId: number
    
    if (!materiaRes.recordset[0]) {
      const request2b = pool.request()
      request2b.input('MAT_DESC', materiaDesc)
      request2b.input('MAT_IDPERIODO', periodoId)
      
      const materiaRes2 = await request2b.query<{ MAT_ID: number }>(`
        SELECT MAT_ID 
        FROM MATERIA 
        WHERE MAT_DESC LIKE @MAT_DESC 
          AND MAT_IDPERIODO = @MAT_IDPERIODO
      `)
      
      if (!materiaRes2.recordset[0]) {
        return NextResponse.json(
          { ok: false, error: `Matéria "${materiaDesc}" não encontrada para o período ${periodoNum}` },
          { status: 404 }
        )
      }
      
      materiaId = materiaRes2.recordset[0].MAT_ID
    } else {
      if (materiaRes.recordset.length > 1 && cursoId) {
        const materiaDoCurso = materiaRes.recordset.find(m => m.MAT_IDCURSO === cursoId)
        materiaId = materiaDoCurso ? materiaDoCurso.MAT_ID : materiaRes.recordset[0].MAT_ID
      } else {
        materiaId = materiaRes.recordset[0].MAT_ID
      }
    }

    // Atualizar a dúvida
    const updateReq = pool.request()
    updateReq.input('DUV_IDDUVIDA', duvidaId)
    updateReq.input('DUV_IDMATERIA', materiaId)
    updateReq.input('DUV_TITULO', titulo)
    updateReq.input('DUV_DESCRICAO', descricao)

    await updateReq.query(`
      UPDATE DUVIDA
      SET DUV_IDMATERIA = @DUV_IDMATERIA,
          DUV_TITULO = @DUV_TITULO,
          DUV_DESCRICAO = @DUV_DESCRICAO
      WHERE DUV_IDDUVIDA = @DUV_IDDUVIDA
    `)

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

    // Verificar se a dúvida existe e se pertence ao usuário
    const checkReq = pool.request()
    checkReq.input('DUV_IDDUVIDA', duvidaId)
    checkReq.input('USU_ID', usuarioId)

    const checkRes = await checkReq.query<{
      DUV_IDDUVIDA: number
      DUV_IDUSUARIO: number
    }>(`
      SELECT DUV_IDDUVIDA, DUV_IDUSUARIO
      FROM DUVIDA
      WHERE DUV_IDDUVIDA = @DUV_IDDUVIDA
    `)

    if (!checkRes.recordset[0]) {
      return NextResponse.json(
        { ok: false, error: 'Dúvida não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a dúvida pertence ao usuário
    const duvidaUsuarioId = typeof checkRes.recordset[0].DUV_IDUSUARIO === 'string'
      ? parseInt(checkRes.recordset[0].DUV_IDUSUARIO, 10)
      : Number(checkRes.recordset[0].DUV_IDUSUARIO)
    
    const usuarioIdNumber = typeof usuarioId === 'string' ? parseInt(usuarioId, 10) : Number(usuarioId)

    if (duvidaUsuarioId !== usuarioIdNumber) {
      return NextResponse.json(
        { ok: false, error: 'Você não tem permissão para excluir esta dúvida' },
        { status: 403 }
      )
    }

    // Excluir a dúvida (as respostas serão excluídas automaticamente devido ao CASCADE)
    const deleteReq = pool.request()
    deleteReq.input('DUV_IDDUVIDA', duvidaId)

    await deleteReq.query(`
      DELETE FROM DUVIDA
      WHERE DUV_IDDUVIDA = @DUV_IDDUVIDA
    `)

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

