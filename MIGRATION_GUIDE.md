# Guia de Migração SQL Server → PostgreSQL

## Mudanças Principais

### 1. Driver do Banco de Dados
- **Antes**: `mssql` 
- **Depois**: `pg` (node-postgres)

### 2. Sintaxe de Queries

#### Parâmetros
- **SQL Server**: `@NomeParam` 
- **PostgreSQL**: `$1, $2, $3...`

```typescript
// SQL Server
request.input('USU_EMAIL', email)
await request.query('SELECT * FROM USUARIO WHERE USU_EMAIL = @USU_EMAIL')

// PostgreSQL  
await pool.query('SELECT * FROM USUARIO WHERE usu_email = $1', [email])
```

#### Nomes de Colunas
- **PostgreSQL retorna nomes em minúsculas** por padrão
- Código precisa converter ou usar minúsculas

```typescript
// SQL Server
const user = result.recordset[0]
console.log(user.USU_NOME) // ✓

// PostgreSQL
const user = result.rows[0]
console.log(user.usu_nome) // ✓ (minúsculas)
console.log(user.USU_NOME) // ✗ undefined
```

### 3. Tipos de Dados

| SQL Server | PostgreSQL |
|------------|-----------|
| `INT IDENTITY(1,1)` | `SERIAL` ou `BIGSERIAL` |
| `BIGINT IDENTITY` | `BIGSERIAL` |
| `BIT` | `BOOLEAN` |
| `VARCHAR(MAX)` | `TEXT` |
| `VARBINARY` | `BYTEA` |
| `DATETIME` | `TIMESTAMP` |
| `GETDATE()` | `CURRENT_TIMESTAMP` |
| `TINYINT` | `SMALLINT` |

### 4. Transações

```typescript
// SQL Server
const tx = pool.transaction()
await tx.begin()
try {
  await request.query(...)
  await tx.commit()
} catch (e) {
  await tx.rollback()
}

// PostgreSQL
const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query(...)
  await client.query('COMMIT')
} catch (e) {
  await client.query('ROLLBACK')
} finally {
  client.release()
}
```

### 5. Valores Booleanos

```typescript
// SQL Server
INSERT INTO USUARIO (..., USU_ATIVO) VALUES (..., 1)  // 0 ou 1

// PostgreSQL  
INSERT INTO USUARIO (..., USU_ATIVO) VALUES (..., TRUE)  // TRUE ou FALSE
```

### 6. Resultados de Query

```typescript
// SQL Server
const result = await request.query(...)
const rows = result.recordset

// PostgreSQL
const result = await pool.query(...)
const rows = result.rows
```

## Arquivos Convertidos

✅ `lib/db.ts` - Pool de conexão PostgreSQL
✅ `lib/sql.ts` - Execução de batches
✅ `lib/pg-helpers.ts` - Funções auxiliares (NOVO)
✅ `package.json` - Dependências atualizadas
✅ `.env.local` - Configuração do Neon
✅ `app/api/db/init/route.ts` - Schema PostgreSQL
✅ `app/api/db/seed/route.ts` - Dados iniciais
✅ `app/api/auth/route.ts` - Autenticação

## Próximos Passos

Os seguintes arquivos ainda precisam ser convertidos:

- [ ] `app/api/usuarios/route.ts`
- [ ] `app/api/duvidas/route.ts`
- [ ] `app/api/respostas/route.ts`
- [ ] `app/api/cursos/route.ts`
- [ ] `app/api/materias/route.ts`
- [ ] `app/api/periodos/route.ts`
- [ ] `app/api/usuarios/avaliacoes/route.ts`
- [ ] `app/api/respostas/avaliacoes/route.ts`
- [ ] `app/api/respostas/count/route.ts`
- [ ] `app/api/duvidas/count/route.ts`

## Padrão de Conversão

Para cada arquivo API route.ts:

1. Remover `request.input()` e usar array de parâmetros
2. Trocar `@Param` por `$1, $2, ...`
3. Trocar `result.recordset` por `result.rows`
4. Converter nomes de colunas de UPPERCASE para lowercase
5. Trocar transações para padrão PostgreSQL
6. Converter valores booleanos (0/1 → TRUE/FALSE)
