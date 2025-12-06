import { getPool } from '@/lib/db'

function splitOnGo(sqlText: string): string[] {
	return sqlText
		.replace(/\r\n/g, '\n')
		.split(/^[\t ]*GO[\t ]*$/gim)
		.map(s => s.trim())
		.filter(s => s.length > 0)
}

export async function executeBatch(sqlText: string): Promise<void> {
	const pool = await getPool()
	const statements = splitOnGo(sqlText)
	for (const stmt of statements) {
		await pool.request().batch(stmt)
	}
}

