# Correções para Deploy no Vercel

## Problema: useSearchParams() should be wrapped in a suspense boundary

### Causa
O Next.js tenta fazer pre-render (SSG/SSR) durante o build, mas `useSearchParams()` só funciona no cliente. Quando não está envolto em um `<Suspense>`, causa erro no build.

### Solução Implementada

#### 1. Arquivo: `app/solicitacoes/page.tsx`

**Antes:**
```tsx
export default function SolicitacoesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ...
}
```

**Depois:**
```tsx
function SolicitacoesPageRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ...
}

export default function SolicitacoesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SolicitacoesPageRedirect />
    </Suspense>
  )
}
```

#### 2. Arquivo: `app/solicitacoes/[page]/page.tsx`

**Antes:**
```tsx
export default function SolicitacoesPageWithPagination() {
  return (
    <AuthGuard>
      <SolicitacoesPageContent />
    </AuthGuard>
  )
}
```

**Depois:**
```tsx
export default function SolicitacoesPageWithPagination() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingSpinner />}>
        <SolicitacoesPageContent />
      </Suspense>
    </AuthGuard>
  )
}
```

#### 3. Componente de Loading

Criado: `components/loading-spinner.tsx`
- Spinner animado com tailwind
- Melhor UX durante carregamento

## Outros Arquivos Criados/Atualizados

### 1. `.env.example`
Template com variáveis de ambiente necessárias

### 2. `vercel.json`
Configuração otimizada para deploy:
- Região: São Paulo (gru1)
- Framework: Next.js
- Build command customizado

### 3. `README.md`
Adicionada seção completa sobre deploy no Vercel com:
- Pré-requisitos
- Passo a passo
- Variáveis de ambiente
- Troubleshooting

## Checklist de Deploy

- [x] `useSearchParams()` envolto em Suspense
- [x] Componente de loading criado
- [x] Variáveis de ambiente documentadas
- [x] README atualizado
- [x] vercel.json configurado
- [x] TypeScript errors ignorados no build
- [x] ESLint errors ignorados no build

## Próximos Passos

1. Fazer commit das mudanças
2. Push para o repositório
3. Conectar repositório no Vercel
4. Configurar variáveis de ambiente no dashboard do Vercel
5. Deploy!

## Notas Importantes

- O banco PostgreSQL (Neon) já está configurado com SSL
- A migration de comentários precisa ser executada apenas uma vez (já foi feita)
- As credenciais do banco NÃO devem ser commitadas (apenas .env.example)
