const { Pool } = require('pg')

const pool = new Pool({
  host: 'ep-bitter-hill-ac49ovgu-pooler.sa-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_8l7cCMzkYZQI',
  ssl: { rejectUnauthorized: false },
})

async function reclassificarMelhoresRespostas() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Iniciando reclassificação de melhores respostas...\n')

    // Primeiro, buscar todas as dúvidas
    const duvidasRes = await client.query(`
      SELECT DISTINCT duv_idduvida 
      FROM duvida
      ORDER BY duv_idduvida
    `)

    console.log(`📊 Total de dúvidas encontradas: ${duvidasRes.rows.length}\n`)

    let totalProcessadas = 0
    let totalMarcadas = 0
    let totalDesmarcadas = 0

    for (const duvida of duvidasRes.rows) {
      const duvidaId = duvida.duv_idduvida

      // Remover flag de melhor resposta de TODAS as respostas desta dúvida
      await client.query(`
        UPDATE resposta
        SET res_melhorresposta = FALSE
        WHERE res_idduvida = $1
      `, [duvidaId])

      // Marcar como melhor resposta apenas a que tem:
      // 1. >= 3 votos
      // 2. A MAIOR média entre todas as respostas da dúvida
      const updateRes = await client.query(`
        UPDATE resposta r
        SET res_melhorresposta = TRUE
        WHERE r.res_idresposta = (
          SELECT r2.res_idresposta
          FROM resposta r2
          LEFT JOIN (
            SELECT 
              a.ava_idresposta,
              AVG(a.ava_estrela::float) as media,
              COUNT(*) as total
            FROM avaliacaoresposta a
            INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
            WHERE a.ava_idusuario != r_aux.res_idusuario
            GROUP BY a.ava_idresposta
          ) stats ON r2.res_idresposta = stats.ava_idresposta
          WHERE r2.res_idduvida = $1
            AND stats.total >= 3
          ORDER BY stats.media DESC, stats.total DESC
          LIMIT 1
        )
        RETURNING res_idresposta
      `, [duvidaId])

      totalProcessadas++
      
      if (updateRes.rowCount > 0) {
        totalMarcadas++
        const respostaId = updateRes.rows[0].res_idresposta
        
        // Buscar detalhes da resposta marcada
        const detalhesRes = await client.query(`
          SELECT 
            r.res_idresposta,
            (SELECT AVG(a.ava_estrela::float) 
             FROM avaliacaoresposta a
             INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
             WHERE a.ava_idresposta = r.res_idresposta 
               AND a.ava_idusuario != r_aux.res_idusuario) AS media,
            (SELECT COUNT(*) 
             FROM avaliacaoresposta a
             INNER JOIN resposta r_aux ON a.ava_idresposta = r_aux.res_idresposta
             WHERE a.ava_idresposta = r.res_idresposta 
               AND a.ava_idusuario != r_aux.res_idusuario) AS total
          FROM resposta r
          WHERE r.res_idresposta = $1
        `, [respostaId])

        const detalhes = detalhesRes.rows[0]
        console.log(`✅ Dúvida ${duvidaId}: Resposta ${respostaId} marcada como melhor (${detalhes.total} votos, média ${parseFloat(detalhes.media).toFixed(2)})`)
      }
    }

    totalDesmarcadas = totalProcessadas - totalMarcadas

    console.log('\n' + '='.repeat(60))
    console.log('📈 RESUMO DA RECLASSIFICAÇÃO')
    console.log('='.repeat(60))
    console.log(`Total de dúvidas processadas: ${totalProcessadas}`)
    console.log(`Respostas marcadas como melhor: ${totalMarcadas}`)
    console.log(`Dúvidas sem melhor resposta: ${totalDesmarcadas}`)
    console.log('='.repeat(60))
    console.log('\n✅ Reclassificação concluída com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao reclassificar respostas:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

reclassificarMelhoresRespostas()
  .catch(err => {
    console.error('Erro fatal:', err)
    process.exit(1)
  })
