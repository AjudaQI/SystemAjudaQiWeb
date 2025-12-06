export type CreateUsuarioInput = {
	idPermissao: number
	matricula: number
	nome: string
	cpf: string
	senha: string
	email: string
	ativo?: boolean
}

export async function createUsuario(input: CreateUsuarioInput): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
	const res = await fetch('/api/usuarios', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	return res.json()
}

