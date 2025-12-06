import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import crypto from 'crypto'

export async function POST() {
	const pool = await getPool()
	const tx = pool.transaction()
	await tx.begin()
	try {
		const request = tx.request()

		// 1) Permissões
		await request.query(`
		INSERT INTO PERMISSAOUSUARIO (PU_NOMEPERMISSAO, PU_POSTARDUVIDA, PU_RESPONDERDUVIDA, PU_AVALIARRESPOSTA)
		VALUES
		('Aluno', 1, 0, 1),
		('Monitor', 1, 1, 1),
		('Administrador', 1, 1, 1);
		`)

		// Obter IDs por nome
		const perms = await request.query<{ PU_IDPERMISSAO: number, PU_NOMEPERMISSAO: string }>(`SELECT PU_IDPERMISSAO, PU_NOMEPERMISSAO FROM PERMISSAOUSUARIO`)
		const permByName = new Map(perms.recordset.map(p => [p.PU_NOMEPERMISSAO, p.PU_IDPERMISSAO]))

		// 2) Curso
		await request.query(`INSERT INTO CURSO (CUR_DESC) VALUES ('Engenharia de Software')`)
		const curso = await request.query<{ CUR_ID: number }>(`SELECT CUR_ID FROM CURSO WHERE CUR_DESC='Engenharia de Software'`)
		const cursoId = curso.recordset[0].CUR_ID

		// 3) Períodos
		for (let i = 1; i <= 8; i++) {
			await request.query(`INSERT INTO PERIODO (PER_DESCRICAO) VALUES ('${i}º Período')`)
		}
		const periodos = await request.query<{ PER_ID: number, PER_DESCRICAO: string }>(`SELECT PER_ID, PER_DESCRICAO FROM PERIODO`)
		const periodo1Id = periodos.recordset.find(p => p.PER_DESCRICAO.startsWith('1'))!.PER_ID
		const periodo2Id = periodos.recordset.find(p => p.PER_DESCRICAO.startsWith('2'))!.PER_ID

		// 4) Matérias
		await request.query(`
		INSERT INTO MATERIA (MAT_IDCURSO, MAT_IDPERIODO, MAT_DESC, MAT_DESCRICAOCONTEUDO) VALUES
		(${cursoId}, ${periodo1Id}, 'Algoritmos e Estruturas de Dados', 'Introdução a estruturas e sua análise.'),
		(${cursoId}, ${periodo2Id}, 'Banco de Dados', 'Modelo relacional, SQL e normalização.');
		`)
		const materias = await request.query<{ MAT_ID: number, MAT_DESC: string }>(`SELECT MAT_ID, MAT_DESC FROM MATERIA`)
		const matAlgId = materias.recordset.find(m => m.MAT_DESC.includes('Algoritmos'))!.MAT_ID
		const matBDId = materias.recordset.find(m => m.MAT_DESC.includes('Banco de Dados'))!.MAT_ID

		// 5) Usuários
		const pass1 = crypto.createHash('sha512').update('senha123').digest()
		const pass2 = crypto.createHash('sha512').update('monitor123').digest()
		const pass3 = crypto.createHash('sha512').update('admin123').digest()

		await request.query(`
		INSERT INTO USUARIO (USU_IDPERMISSAO, USU_MATRICULA, USU_NOME, USU_CPF, USU_SENHA, USU_EMAIL)
		VALUES
		(${permByName.get('Aluno')}, 20250001, 'João Silva', '11122233344', 0x${pass1.toString('hex')}, 'joao@example.com'),
		(${permByName.get('Monitor')}, 20250002, 'Maria Souza', '22233344455', 0x${pass2.toString('hex')}, 'maria@example.com'),
		(${permByName.get('Administrador')}, 20250003, 'Admin User', '33344455566', 0x${pass3.toString('hex')}, 'admin@example.com');
		`)

		const usuarios = await request.query<{ USU_ID: number, USU_EMAIL: string }>(`SELECT USU_ID, USU_EMAIL FROM USUARIO`)
		const alunoId = usuarios.recordset.find(u => u.USU_EMAIL === 'joao@example.com')!.USU_ID
		const monitorId = usuarios.recordset.find(u => u.USU_EMAIL === 'maria@example.com')!.USU_ID
		const adminId = usuarios.recordset.find(u => u.USU_EMAIL === 'admin@example.com')!.USU_ID

		// 6) Administrador 1:1
		await request.query(`INSERT INTO USUARIOADMINISTRADOR (USRADM_IDUSUARIO) VALUES (${adminId})`)

		// 7) Dúvidas
		await request.query(`
		INSERT INTO DUVIDA (DUV_IDUSUARIO, DUV_IDMATERIA, DUV_TITULO, DUV_DESCRICAO)
		VALUES
		(${alunoId}, ${matAlgId}, 'Como funciona a fila em uma BFS?', 'Tenho dúvidas sobre a ordem de visitas na BFS.'),
		(${alunoId}, ${matBDId}, 'Normalização 3FN', 'Exemplos práticos de como chegar em 3FN.');
		`)
		const duvidas = await request.query<{ DUV_IDDUVIDA: number, DUV_TITULO: string }>(`SELECT DUV_IDDUVIDA, DUV_TITULO FROM DUVIDA`)
		const duvidaBfsId = duvidas.recordset.find(d => d.DUV_TITULO.includes('BFS'))!.DUV_IDDUVIDA
		const duvida3fnId = duvidas.recordset.find(d => d.DUV_TITULO.includes('3FN'))!.DUV_IDDUVIDA

		// 8) Respostas
		await request.query(`
		INSERT INTO RESPOSTA (RES_IDDUVIDA, RES_IDUSUARIO, RES_DESCRICAO, RES_MELHORRESPOSTA)
		VALUES
		(${duvidaBfsId}, ${monitorId}, 'Use uma fila FIFO e visite vizinhos por nível.', 1),
		(${duvida3fnId}, ${monitorId}, 'Identifique dependências transitivas e remova-as com novas tabelas.', 0);
		`)
		const respostas = await request.query<{ RES_IDRESPOSTA: number }>(`SELECT RES_IDRESPOSTA FROM RESPOSTA`)
		const resposta1Id = respostas.recordset[0].RES_IDRESPOSTA

		// 9) Avaliação
		await request.query(`
		INSERT INTO AVALIACAORESPOSTA (AVA_IDRESPOSTA, AVA_IDUSUARIO, AVA_ESTRELA)
		VALUES
		(${resposta1Id}, ${alunoId}, 5);
		`)

		await tx.commit()
		return NextResponse.json({ ok: true })
	} catch (err) {
		await tx.rollback()
		return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
	}
}

