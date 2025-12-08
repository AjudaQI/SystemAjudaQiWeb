import { Pool, PoolClient, QueryResult } from 'pg'

let pool: Pool | null = null

function getConfigFromEnv() {
	const host = process.env.DB_SERVER
	const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432
	const user = process.env.DB_USER
	const password = process.env.DB_PASSWORD
	const database = process.env.DB_NAME
	const ssl = (process.env.DB_ENCRYPT ?? 'true').toLowerCase() === 'true'

	if (!host) throw new Error('Missing env: DB_SERVER')
	if (!user) throw new Error('Missing env: DB_USER')
	if (!password) throw new Error('Missing env: DB_PASSWORD')
	if (!database) throw new Error('Missing env: DB_NAME')

	return {
		host,
		port,
		user,
		password,
		database,
		ssl: ssl ? { rejectUnauthorized: false } : false,
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 7000,
	}
}

export async function getPool(): Promise<Pool> {
	if (!pool) {
		const config = getConfigFromEnv()
		pool = new Pool(config)
		
		pool.on('error', (err) => {
			console.error('Unexpected error on idle client', err)
		})
	}
	return pool
}

export async function query<T = any>(queryText: string, params?: any[]): Promise<T[]> {
	const poolInstance = await getPool()
	const result: QueryResult<T> = await poolInstance.query(queryText, params)
	return result.rows
}

export async function closePool(): Promise<void> {
	if (pool) {
		await pool.end()
		pool = null
	}
}

