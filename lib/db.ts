import sql, { ConnectionPool, config as SqlConfig } from 'mssql'

let connectionPool: ConnectionPool | null = null

function getConfigFromEnv(): SqlConfig {
	const server = process.env.DB_SERVER
	const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433
	const user = process.env.DB_USER
	const password = process.env.DB_PASSWORD
	const database = process.env.DB_NAME
	const encrypt = (process.env.DB_ENCRYPT ?? 'true').toLowerCase() === 'true'
	const trustServerCertificate = (process.env.DB_TRUST_SERVER_CERT ?? 'false').toLowerCase() === 'true'

	if (!server) throw new Error('Missing env: DB_SERVER')
	if (!user) throw new Error('Missing env: DB_USER')
	if (!password) throw new Error('Missing env: DB_PASSWORD')
	if (!database) throw new Error('Missing env: DB_NAME')

	return {
		server,
		port,
		authentication: {
			type: 'default',
			options: { userName: user, password },
		},
		options: {
			database,
			encrypt,
			trustServerCertificate,
		},
		pool: {
			max: 10,
			min: 0,
			idleTimeoutMillis: 30000,
		},
		requestTimeout: 10000,
		connectionTimeout: 7000,
	}
}

export async function getPool(): Promise<ConnectionPool> {
	if (connectionPool && connectionPool.connected) return connectionPool

	const cfg = getConfigFromEnv()
	connectionPool = await new sql.ConnectionPool(cfg).connect()
	return connectionPool
}

export async function query<T = unknown>(queryText: string, params?: Record<string, unknown>): Promise<T[]> {
	const pool = await getPool()
	const request = pool.request()

	if (params) {
		for (const [key, value] of Object.entries(params)) {
			request.input(key, value as never)
		}
	}

	const result = await request.query<T>(queryText)
	return result.recordset ?? []
}

export async function closePool(): Promise<void> {
	if (connectionPool) {
		await connectionPool.close()
		connectionPool = null
	}
}

