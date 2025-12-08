# Migração SQL Server → PostgreSQL - Status

## ✅ Concluído

### 1. Infraestrutura Base
- ✅ Instalação do driver `pg` e `@types/pg`
- ✅ Remoção do driver `mssql` e `@types/mssql`
- ✅ Configuração do `.env.local` com credenciais Neon PostgreSQL
- ✅ Atualização do `lib/db.ts` para usar pool PostgreSQL
- ✅ Atualização do `lib/sql.ts` para executeBatch PostgreSQL
- ✅ Criação de `lib/pg-helpers.ts` com funções auxiliares

### 2. Scripts do Banco de Dados
- ✅ `app/api/db/init/route.ts` - Schema completo PostgreSQL
  - Convertido IDENTITY para SERIAL/BIGSERIAL
  - Convertido BIT para BOOLEAN
  - Convertido VARCHAR(MAX) para TEXT  
  - Convertido VARBINARY para BYTEA
  - Convertido DATETIME para TIMESTAMP
  - Adicionado CASCADE nos DROPs
  
- ✅ `app/api/db/seed/route.ts` - Dados de teste
  - Convertido para usar parâmetros posicionais ($1, $2...)
  - Atualizado para usar client.query() e client.rows
  - Conversão de valores booleanos (1/0 → TRUE/FALSE)

### 3. Rotas da API Convertidas
- ✅ `app/api/auth/route.ts` - Autenticação
- ✅ `app/api/periodos/route.ts` - Períodos
- ✅ `app/api/db/route.ts` - Teste de conexão (já estava compatível)
- ✅ `app/api/version/route.ts` - Versão (não usa banco)

## ⚠️ Pendente - Rotas que Precisam de Conversão Manual

Os seguintes arquivos ainda precisam ser convertidos de SQL Server para PostgreSQL:

### Rotas Complexas (Precisam Atenção)
1. **`app/api/usuarios/route.ts`** - CRÍTICO
   - GET, POST, PUT com muitas queries
   - Manejo de VARBINARY/BYTEA para senhas
   - Queries complexas com JOINs

2. **`app/api/duvidas/route.ts`** - CRÍTICO  
   - POST, GET, PUT, DELETE
   - Queries com múltiplos JOINs
   - Lógica complexa de períodos

3. **`app/api/respostas/route.ts`** - CRÍTICO
   - POST, GET, PUT, DELETE
   - Queries com agregações (AVG, COUNT)
   - Cálculos de avaliações

4. **`app/api/cursos/route.ts`**
   - GET, POST, PUT, DELETE
   - Validações de FK

5. **`app/api/materias/route.ts`**
   - GET, POST, PUT, DELETE
   - Filtros por curso e período

### Rotas Mais Simples
6. `app/api/usuarios/avaliacoes/route.ts`
7. `app/api/respostas/avaliacoes/route.ts`
8. `app/api/respostas/count/route.ts`
9. `app/api/duvidas/count/route.ts`

## 📝 Padrão de Conversão

Para cada arquivo pendente, siga este padrão:

```typescript
// ANTES (SQL Server)
const pool = await getPool()
const request = pool.request()
request.input('PARAM1', value1)
request.input('PARAM2', value2)
const result = await request.query(`
  SELECT COL1, COL2 
  FROM TABELA 
  WHERE COL1 = @PARAM1 AND COL2 = @PARAM2
`)
const data = result.recordset

// DEPOIS (PostgreSQL)
const pool = await getPool()
const result = await pool.query(`
  SELECT col1, col2 
  FROM TABELA 
  WHERE col1 = $1 AND col2 = $2
`, [value1, value2])

// Converter nomes para maiúsculas (compatibilidade)
const data = result.rows.map(row => ({
  COL1: row.col1,
  COL2: row.col2
}))
```

## 🔧 Próximos Passos

1. **Inicializar o Banco de Dados**
   ```bash
   curl -X POST "http://localhost:3000/api/db/init?drop=true"
   ```

2. **Popular com Dados de Teste**
   ```bash
   curl -X POST "http://localhost:3000/api/db/seed"
   ```

3. **Converter Arquivos Restantes**
   - Começar por `usuarios/route.ts` (mais crítico)
   - Depois `duvidas/route.ts`
   - Depois `respostas/route.ts`
   - Por último os arquivos mais simples

4. **Testar Cada Rota**
   - Após converter cada arquivo, testar a rota correspondente
   - Verificar se os dados são retornados corretamente
   - Verificar se INSERTs/UPDATEs/DELETEs funcionam

## 📚 Documentação de Referência

- **PostgreSQL vs SQL Server**: `/MIGRATION_GUIDE.md`
- **Driver node-postgres**: https://node-postgres.com/
- **Neon PostgreSQL**: https://neon.tech/docs

## ⚡ Comandos Úteis

```bash
# Instalar dependências (se necessário)
npm install --legacy-peer-deps

# Iniciar servidor de desenvolvimento
npm run dev

# Ver logs do PostgreSQL
# (verificar no dashboard do Neon)
```

## 🐛 Problemas Conhecidos

1. **Nomes de Colunas**: PostgreSQL retorna em minúsculas, código espera maiúsculas
   - **Solução**: Mapear todos os result.rows para maiúsculas

2. **Parâmetros**: SQL Server usa @param, PostgreSQL usa $1
   - **Solução**: Converter todos os parâmetros nomeados para posicionais

3. **Booleanos**: SQL Server usa 0/1, PostgreSQL usa TRUE/FALSE
   - **Solução**: Já convertido no schema e seed

4. **BYTEA**: Senhas são armazenadas como BYTEA (equivalente a VARBINARY)
   - **Solução**: Buffer.from() e .toString('hex') continuam funcionando
