import { getPool } from '@/lib/db'

export async function executeBatch(sqlText: string): Promise<void> {
	const pool = await getPool()
	
	// PostgreSQL não precisa de separador GO, mas vamos remover se existir
	const statements = sqlText
		.replace(/\r\n/g, '\n')
		.split(/^[\t ]*GO[\t ]*$/gim)
		.map(s => s.trim())
		.filter(s => s.length > 0)
	
	for (const stmt of statements) {
		await pool.query(stmt)
	}
}

