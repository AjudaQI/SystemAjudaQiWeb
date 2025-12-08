import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import crypto from 'crypto'

export async function POST() {
	const pool = await getPool()
	const client = await pool.connect()
	
	try {
		await client.query('BEGIN')

		// 1) Permissões
		await client.query(`
		INSERT INTO PERMISSAOUSUARIO (PU_NOMEPERMISSAO, PU_POSTARDUVIDA, PU_RESPONDERDUVIDA, PU_AVALIARRESPOSTA)
		VALUES
		('Aluno', TRUE, FALSE, TRUE),
		('Administrador', TRUE, TRUE, TRUE),
		('Monitor', TRUE, TRUE, TRUE);
		`)

		// Obter IDs por nome
		const perms = await client.query<{ pu_idpermissao: number, pu_nomepermissao: string }>(`SELECT pu_idpermissao, pu_nomepermissao FROM PERMISSAOUSUARIO`)
		const permByName = new Map(perms.rows.map(p => [p.pu_nomepermissao, p.pu_idpermissao]))

		// 2) Curso
		await client.query(`INSERT INTO CURSO (CUR_DESC) VALUES ('Engenharia de Software')`)
		const curso = await client.query<{ cur_id: number }>(`SELECT cur_id FROM CURSO WHERE CUR_DESC='Engenharia de Software'`)
		const cursoId = curso.rows[0].cur_id

		// 3) Períodos
		for (let i = 1; i <= 8; i++) {
			await client.query(`INSERT INTO PERIODO (PER_DESCRICAO) VALUES ('${i}º Período')`)
		}
		const periodos = await client.query<{ per_id: number, per_descricao: string }>(`SELECT per_id, per_descricao FROM PERIODO`)
		const periodo1Id = periodos.rows.find(p => p.per_descricao.startsWith('1'))!.per_id
		const periodo2Id = periodos.rows.find(p => p.per_descricao.startsWith('2'))!.per_id

		// 4) Matérias
		await client.query(`
		INSERT INTO MATERIA (MAT_IDCURSO, MAT_IDPERIODO, MAT_DESC, MAT_DESCRICAOCONTEUDO) VALUES
		($1, $2, 'Algoritmos e Estruturas de Dados', 'Introdução a estruturas e sua análise.'),
		($1, $3, 'Banco de Dados', 'Modelo relacional, SQL e normalização.');
		`, [cursoId, periodo1Id, periodo2Id])
		
		const materias = await client.query<{ mat_id: number, mat_desc: string }>(`SELECT mat_id, mat_desc FROM MATERIA`)
		const matAlgId = materias.rows.find(m => m.mat_desc.includes('Algoritmos'))!.mat_id
		const matBDId = materias.rows.find(m => m.mat_desc.includes('Banco de Dados'))!.mat_id

		// 5) Usuários
		const pass1 = crypto.createHash('sha512').update('senha123').digest()
		const pass2 = crypto.createHash('sha512').update('monitor123').digest()
		const pass3 = crypto.createHash('sha512').update('admin123').digest()

		await client.query(`
		INSERT INTO USUARIO (USU_IDPERMISSAO, USU_MATRICULA, USU_NOME, USU_CPF, USU_SENHA, USU_EMAIL)
		VALUES
		($1, 20250001, 'João Silva', '11122233344', $2, 'joao@example.com'),
		($3, 20250002, 'Maria Souza', '22233344455', $4, 'maria@example.com'),
		($5, 20250003, 'Admin User', '33344455566', $6, 'admin@example.com');
		`, [permByName.get('Aluno'), pass1, permByName.get('Monitor'), pass2, permByName.get('Administrador'), pass3])

		const usuarios = await client.query<{ usu_id: number, usu_email: string }>(`SELECT usu_id, usu_email FROM USUARIO`)
		const alunoId = usuarios.rows.find(u => u.usu_email === 'joao@example.com')!.usu_id
		const monitorId = usuarios.rows.find(u => u.usu_email === 'maria@example.com')!.usu_id
		const adminId = usuarios.rows.find(u => u.usu_email === 'admin@example.com')!.usu_id

		// 6) Administrador 1:1
		await client.query(`INSERT INTO USUARIOADMINISTRADOR (USRADM_IDUSUARIO) VALUES ($1)`, [adminId])

		// 7) Dúvidas
		await client.query(`
		INSERT INTO DUVIDA (DUV_IDUSUARIO, DUV_IDMATERIA, DUV_TITULO, DUV_DESCRICAO)
		VALUES
		($1, $2, 'Como funciona a fila em uma BFS?', 'Tenho dúvidas sobre a ordem de visitas na BFS.'),
		($1, $3, 'Normalização 3FN', 'Exemplos práticos de como chegar em 3FN.');
		`, [alunoId, matAlgId, matBDId])
		
		const duvidas = await client.query<{ duv_idduvida: number, duv_titulo: string }>(`SELECT duv_idduvida, duv_titulo FROM DUVIDA`)
		const duvidaBfsId = duvidas.rows.find(d => d.duv_titulo.includes('BFS'))!.duv_idduvida
		const duvida3fnId = duvidas.rows.find(d => d.duv_titulo.includes('3FN'))!.duv_idduvida

		// 8) Respostas
		await client.query(`
		INSERT INTO RESPOSTA (RES_IDDUVIDA, RES_IDUSUARIO, RES_DESCRICAO, RES_MELHORRESPOSTA)
		VALUES
		($1, $2, 'Use uma fila FIFO e visite vizinhos por nível.', TRUE),
		($3, $2, 'Identifique dependências transitivas e remova-as com novas tabelas.', FALSE);
		`, [duvidaBfsId, monitorId, duvida3fnId])
		
		const respostas = await client.query<{ res_idresposta: number }>(`SELECT res_idresposta FROM RESPOSTA`)
		const resposta1Id = respostas.rows[0].res_idresposta

		// 9) Avaliação
		await client.query(`
		INSERT INTO AVALIACAORESPOSTA (AVA_IDRESPOSTA, AVA_IDUSUARIO, AVA_ESTRELA)
		VALUES ($1, $2, 5);
		`, [resposta1Id, alunoId])

		await client.query('COMMIT')
		return NextResponse.json({ ok: true })
	} catch (err) {
		await client.query('ROLLBACK')
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	} finally {
		client.release()
	}
}

