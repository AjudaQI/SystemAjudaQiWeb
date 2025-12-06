import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
	try {
		const rows = await query<{ ok: number }>('SELECT 1 AS ok')
		return NextResponse.json({ ok: true, result: rows[0]?.ok === 1 })
	} catch (err) {
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}

