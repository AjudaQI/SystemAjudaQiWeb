# Sistema de Permissões - Ajudaqi

## Estrutura de Permissões

O sistema Ajudaqi utiliza três níveis de permissão armazenados na tabela `PERMISSAOUSUARIO`:

### 1. Aluno (ID: 1)
- **Postar Dúvida**: ✅ Sim
- **Responder Dúvida**: ❌ Não
- **Avaliar Resposta**: ✅ Sim

**Descrição**: Perfil básico para estudantes que podem criar dúvidas e avaliar as respostas recebidas, mas não podem responder dúvidas de outros alunos.

---

### 2. Administrador (ID: 2)
- **Postar Dúvida**: ✅ Sim
- **Responder Dúvida**: ✅ Sim
- **Avaliar Resposta**: ✅ Sim
- **Acesso ao Painel Admin**: ✅ Sim

**Descrição**: Perfil com acesso completo ao sistema. Além de todas as funcionalidades de Aluno e Monitor, pode:
- Gerenciar usuários
- Gerenciar cursos
- Gerenciar matérias
- Gerenciar períodos
- Acessar relatórios e denúncias
- Visualizar estatísticas do sistema

**Páginas Exclusivas**:
- `/admin` - Painel administrativo completo

---

### 3. Monitor (ID: 3)
- **Postar Dúvida**: ✅ Sim
- **Responder Dúvida**: ✅ Sim
- **Avaliar Resposta**: ✅ Sim

**Descrição**: Perfil para estudantes monitores que podem ajudar outros alunos respondendo dúvidas. Possuem todas as funcionalidades de Aluno, mais a capacidade de responder dúvidas.

---

## Verificação de Permissões no Código

### Frontend

#### Verificar se é Administrador:
```typescript
const isAdmin = user?.USU_IDPERMISSAO === 2 || user?.USU_IDPERMISSAO === "2"
```

#### Verificar se pode responder dúvidas (Monitor ou Admin):
```typescript
const canAnswer = user?.USU_IDPERMISSAO === 2 || user?.USU_IDPERMISSAO === 3 || 
                  user?.USU_IDPERMISSAO === "2" || user?.USU_IDPERMISSAO === "3"
```

### Backend

As permissões são armazenadas como `usu_idpermissao` (tipo INTEGER) no banco de dados PostgreSQL.

---

## Usuários Padrão (Seed Data)

Ao executar o seed (`POST /api/db/seed`), são criados os seguintes usuários de teste:

1. **João Silva** (Aluno)
   - Email: `joao@example.com`
   - Senha: `senha123`
   - Permissão: Aluno (ID: 1)

2. **Maria Santos** (Administrador)
   - Email: `maria@example.com`
   - Senha: `senha123`
   - Permissão: Administrador (ID: 2)

3. **Carlos Souza** (Monitor)
   - Email: `carlos@example.com`
   - Senha: `senha123`
   - Permissão: Monitor (ID: 3)

---

## Fluxo de Autenticação

1. Usuário faz login via `POST /api/auth`
2. API retorna objeto `user` com campo `USU_IDPERMISSAO`
3. Frontend armazena no `localStorage` como `ajudaqi_user`
4. Hook `useAuth()` lê e disponibiliza os dados do usuário
5. Componentes verificam `user.USU_IDPERMISSAO` para controle de acesso

---

## Arquivos Relacionados

- `/app/api/db/seed/route.ts` - Define a ordem de inserção das permissões
- `/app/api/db/init/route.ts` - Cria a tabela PERMISSAOUSUARIO
- `/hooks/use-auth.ts` - Hook para gerenciamento de autenticação
- `/components/sidebar.tsx` - Verifica permissão para exibir menu Admin
- `/app/admin/page.tsx` - Verifica permissão para acesso ao painel
- `/components/auth-guard.tsx` - Proteção de rotas autenticadas

---

## Importante

⚠️ **Ao modificar a ordem ou IDs das permissões no seed, é necessário atualizar todas as verificações hardcoded no código!**

Arquivos que verificam permissões específicas:
- `components/sidebar.tsx` - linha ~101
- `app/admin/page.tsx` - linha ~144
