const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_8l7cCMzkYZQI@ep-bitter-hill-ac49ovgu-pooler.sa-east-1.aws.neon.tech:5432/neondb?sslmode=require',
})

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../migrations/create-log-exclusao.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('Executando migration de log de exclusão...')
    console.log(sql)
    
    await pool.query(sql)
    
    console.log('✅ Migration executada com sucesso!')
    
    // Verificar se a tabela foi criada
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'logexclusaoduvida'
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ Tabela logexclusaoduvida criada!')
    } else {
      console.log('❌ Tabela logexclusaoduvida não foi encontrada')
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error)
  } finally {
    await pool.end()
  }
}

runMigration()
