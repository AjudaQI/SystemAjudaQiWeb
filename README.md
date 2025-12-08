# Ajudaqi university platform

## Overview

Sistema de ajuda colaborativa entre alunos universitários, permitindo que estudantes postem dúvidas e recebam respostas de colegas e monitores.

## Funcionalidades Principais

- **Sistema de Dúvidas e Respostas**: Alunos podem postar dúvidas sobre matérias específicas e receber ajuda da comunidade
- **Avaliações**: Sistema de avaliação de respostas para garantir qualidade
- **Gerenciamento Administrativo**: Painel completo para administradores gerenciarem cursos, matérias e usuários
- **Sistema de Permissões**: 
  - **Aluno (ID 1)**: Pode postar dúvidas e avaliar respostas
  - **Administrador (ID 2)**: Acesso completo ao sistema, incluindo gerenciamento de matérias, cursos e usuários
  - **Monitor (ID 3)**: Pode postar dúvidas, responder e avaliar respostas

## Tecnologias

- **Frontend**: Next.js 16.0.7, React 19.2.1, TypeScript
- **UI**: TailwindCSS, Shadcn/ui components
- **Database**: PostgreSQL (Neon) - migrado de SQL Server
- **Driver**: node-postgres (pg)

## Database (PostgreSQL on Neon)

This app includes a basic SQL Server connection using the `mssql` driver and a test API route.

1) Create a `.env.local` file in the project root with:


2) Start the dev server:

```
npm run dev
```

3) Test the connection by visiting:

```
http://localhost:3000/api/db
```

## Deploy no Vercel

### Pré-requisitos

1. Conta no Vercel (https://vercel.com)
2. Repositório GitHub/GitLab/Bitbucket com o código

### Passos para Deploy

1. **Importar o Projeto**
   - Acesse https://vercel.com/new
   - Conecte seu repositório
   - Selecione o projeto

2. **Configurar Variáveis de Ambiente**
   
   No painel do Vercel, adicione as seguintes variáveis de ambiente:
   
   ```
   DB_SERVER=ep-bitter-hill-ac49ovgu-pooler.sa-east-1.aws.neon.tech
   DB_PORT=5432
   DB_USER=neondb_owner
   DB_PASSWORD=npg_8l7cCMzkYZQI
   DB_NAME=neondb
   DB_ENCRYPT=true
   ```

3. **Deploy**
   - Clique em "Deploy"
   - O Vercel detectará automaticamente Next.js
   - Aguarde o build finalizar

### Resolução de Problemas

**Erro: "useSearchParams() should be wrapped in a suspense boundary"**
- ✅ Já corrigido! Os componentes que usam `useSearchParams()` agora estão envolvidos em `<Suspense>`

**Erro de TypeScript durante build**
- O projeto está configurado com `ignoreBuildErrors: true` no `next.config.mjs`

**Erro de conexão com o banco**
- Verifique se todas as variáveis de ambiente estão configuradas corretamente no Vercel
- O Neon PostgreSQL deve estar acessível publicamente

### Comandos Úteis

```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev

# Build de produção (teste local)
npm run build

# Executar migration de comentários
node scripts/run-migration.js
```

- Success: `{ ok: true, result: true }`
- Failure: `{ ok: false, error: "..." }`

Files added:
- `lib/db.ts`: Shared connection pool and `query` helper
- `app/api/db/route.ts`: Test endpoint that runs `SELECT 1 AS ok`

### Initialize schema and seed data

1) Ensure `.env.local` is configured (see section above). You must set `DB_NAME`.
2) Start dev server:

```
npm run dev
```

3) Create schema (drops existing tables if you pass drop=true):

```
curl -X POST http://localhost:3000/api/db/init?drop=true
```

4) Seed fake data:

```
curl -X POST http://localhost:3000/api/db/seed
```

5) Verify connection:

```
http://localhost:3000/api/db
```
