# Hooks Customizados

Esta pasta contém hooks customizados reutilizáveis para o projeto Ajudaqi.

## Hooks Disponíveis

### `useAuth`
Gerencia a autenticação e dados do usuário logado.

```tsx
import { useAuth } from "@/hooks"

function MyComponent() {
  const { user, loading, updateUser, logout, isAuthenticated } = useAuth()

  if (loading) return <div>Carregando...</div>
  if (!isAuthenticated) return <div>Não autenticado</div>

  return <div>Olá, {user?.USU_NOME}</div>
}
```

**Retorna:**
- `user`: Dados do usuário logado ou `null`
- `loading`: Estado de carregamento inicial
- `updateUser`: Função para atualizar os dados do usuário
- `logout`: Função para fazer logout
- `isAuthenticated`: Boolean indicando se o usuário está autenticado

---

### `useLocalStorage`
Gerencia valores no localStorage de forma reativa.

```tsx
import { useLocalStorage } from "@/hooks"

function MyComponent() {
  const [theme, setTheme] = useLocalStorage("theme", "light")

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Tema: {theme}
    </button>
  )
}
```

**Parâmetros:**
- `key`: Chave no localStorage
- `initialValue`: Valor inicial caso não exista

**Retorna:**
- `[value, setValue]`: Similar ao `useState`, mas sincronizado com localStorage

---

### `useFormatDate`
Fornece funções utilitárias para formatação de datas.

```tsx
import { useFormatDate } from "@/hooks"

function MyComponent() {
  const { formatDate, formatDateTime, formatTimeAgo } = useFormatDate()

  return (
    <div>
      <p>Data: {formatDate("2024-01-15")}</p>
      <p>Data/Hora: {formatDateTime("2024-01-15T10:30:00")}</p>
      <p>Há: {formatTimeAgo("2024-01-15T10:30:00")}</p>
    </div>
  )
}
```

**Funções disponíveis:**
- `formatDate`: Formata para "DD/MM/YYYY"
- `formatDateTime`: Formata para "DD/MM/YYYY HH:MM"
- `formatTimeAgo`: Formata como "X horas/dias atrás"

---

### `useDebounce`
Atrasa a atualização de um valor. Útil para busca e filtros.

```tsx
import { useDebounce } from "@/hooks"
import { useState } from "react"

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    // Esta função só será chamada 500ms após o usuário parar de digitar
    if (debouncedSearch) {
      performSearch(debouncedSearch)
    }
  }, [debouncedSearch])

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  )
}
```

**Parâmetros:**
- `value`: Valor a ser debounced
- `delay`: Delay em milissegundos (padrão: 300ms)

**Retorna:**
- Valor debounced

---

## Exemplo de Refatoração

### Antes:
```tsx
function DashboardPage() {
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem('ajudaqi_user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserName(user.USU_NOME?.split(' ')[0] || "")
    }
  }, [])

  const formatTimeAgo = (dateString: string) => {
    // ... lógica repetida
  }
}
```

### Depois:
```tsx
import { useAuth, useFormatDate } from "@/hooks"

function DashboardPage() {
  const { user } = useAuth()
  const { formatTimeAgo } = useFormatDate()
  const userName = user?.USU_NOME?.split(' ')[0] || ""
}
```

---

### `useFilters`
Gerencia filtros e busca em listas de forma reutilizável.

```tsx
import { useFilters } from "@/hooks"

function SolicitacoesPage() {
  const { requests } = useHelpRequests()
  const { searchTerm, setSearchTerm, filters, setFilter, filteredItems } = useFilters(requests, {
    searchFields: ["title", "description"],
    filters: {
      subject: { field: "subject" },
      priority: { field: "priority" },
    },
  })

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
      />
      <select
        value={filters.priority || "all"}
        onChange={(e) => setFilter("priority", e.target.value)}
      >
        <option value="all">Todas</option>
        <option value="alta">Alta</option>
      </select>
      {filteredItems.map((item) => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  )
}
```

---

### `useStatusColors`
Fornece funções para obter cores e ícones de status/prioridade.

```tsx
import { useStatusColors } from "@/hooks"

function MyComponent() {
  const { getStatusColor, getPriorityColor, getPriorityIcon } = useStatusColors()

  return (
    <div>
      <Badge className={getStatusColor("pendente")}>Pendente</Badge>
      <Badge variant={getPriorityColor("alta")}>
        {getPriorityIcon("alta")}
        Alta
      </Badge>
    </div>
  )
}
```

**Funções disponíveis:**
- `getStatusColor`: Retorna classes CSS para status
- `getStatusText`: Retorna texto traduzido do status
- `getPriorityColor`: Retorna variante do Badge para prioridade
- `getPriorityIcon`: Retorna ícone React para prioridade
- `getStatusIcon`: Retorna ícone React para status

---

### `useSupabaseQuery`
Faz queries no Supabase com loading e error handling automático.

```tsx
import { useSupabaseQuery } from "@/hooks"

function UsersList() {
  const { data: users, loading, error, refetch } = useSupabaseQuery({
    table: "users",
    query: (builder) => builder.order("created_at", { ascending: false }),
  })

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error.message}</div>

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

---

### `useSupabaseMutation`
Gerencia operações CRUD (Create, Update, Delete) no Supabase.

```tsx
import { useSupabaseMutation } from "@/hooks"

function UserForm() {
  const { create, update, remove, loading } = useSupabaseMutation("users")

  const handleCreate = async () => {
    const { data, error } = await create({ name: "João", email: "joao@email.com" })
    if (error) {
      console.error("Erro:", error)
    } else {
      console.log("Criado:", data)
    }
  }

  return <button onClick={handleCreate} disabled={loading}>Criar</button>
}
```

---

### `useForm`
Gerencia formulários com validação e estados de erro.

```tsx
import { useForm } from "@/hooks"

function ProfileForm() {
  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: { name: "", email: "" },
    validate: (values) => {
      const errors: any = {}
      if (!values.name) errors.name = "Nome é obrigatório"
      if (!values.email) errors.email = "Email é obrigatório"
      return errors
    },
    onSubmit: async (values) => {
      await saveProfile(values)
    },
  })

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name}
        onChange={(e) => handleChange("name")(e.target.value)}
      />
      {errors.name && <span>{errors.name}</span>}
      <button type="submit" disabled={isSubmitting}>
        Salvar
      </button>
    </form>
  )
}
```

---

## Benefícios

1. **Reutilização**: Lógica compartilhada entre componentes
2. **Manutenibilidade**: Mudanças em um lugar afetam todos os usos
3. **Testabilidade**: Hooks podem ser testados isoladamente
4. **Legibilidade**: Código mais limpo e focado na lógica do componente
5. **Consistência**: Comportamento uniforme em toda a aplicação
6. **Produtividade**: Menos código repetido, desenvolvimento mais rápido

