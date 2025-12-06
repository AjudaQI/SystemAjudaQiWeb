"use client"
import { createContext, useContext, useState, ReactNode } from "react"

export interface HelpRequest {
  id: number
  title: string
  description: string
  subject: string
  priority: "baixa" | "media" | "alta"
  estimatedHours: number
  availableForChat: boolean
  period: string
  course: string
  createdAt: string
  status: "pendente" | "em-andamento" | "resolvida"
  author: {
    name: string
    avatar?: string
    rating: number
    isCurrentUser?: boolean
  }
}

interface HelpRequestsContextType {
  requests: HelpRequest[]
  addRequest: (request: Omit<HelpRequest, "id" | "author">) => void
  updateRequest: (id: number, request: Partial<Omit<HelpRequest, "id" | "author">>) => void
  updateRequestStatus: (id: number, status: HelpRequest["status"]) => void
  deleteRequest: (id: number) => void
  getUserRequests: () => HelpRequest[]
}

const HelpRequestsContext = createContext<HelpRequestsContextType | undefined>(undefined)

export function HelpRequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<HelpRequest[]>([
    {
      id: 1,
      title: "Dúvida sobre árvores binárias",
      description:
        "Estou com dificuldade para entender como implementar a busca em árvores binárias. Preciso de ajuda com a lógica recursiva e como percorrer a árvore de forma eficiente.",
      subject: "Algoritmos e Estruturas de Dados",
      priority: "alta",
      estimatedHours: 2,
      availableForChat: true,
      period: "4",
      course: "Engenharia de Software",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: "pendente",
      author: {
        name: "Maria Santos",
        rating: 4.5,
        isCurrentUser: false,
      },
    },
    {
      id: 2,
      title: "Normalização de banco de dados",
      description:
        "Preciso de ajuda para entender as formas normais, especialmente a 3FN. Tenho um exercício sobre normalização que não estou conseguindo resolver.",
      subject: "Banco de Dados",
      priority: "media",
      estimatedHours: 1,
      availableForChat: false,
      period: "5",
      course: "Engenharia de Software",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      status: "pendente",
      author: {
        name: "Pedro Lima",
        rating: 4.2,
        isCurrentUser: false,
      },
    },
    {
      id: 3,
      title: "Padrões de projeto - Strategy",
      description:
        "Estou estudando padrões de projeto e não estou conseguindo entender quando usar o padrão Strategy. Alguém pode me dar exemplos práticos?",
      subject: "Engenharia de Software",
      priority: "baixa",
      estimatedHours: 1,
      availableForChat: true,
      period: "6",
      course: "Engenharia de Software",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pendente",
      author: {
        name: "Ana Costa",
        rating: 4.8,
        isCurrentUser: false,
      },
    },
    {
      id: 4,
      title: "Programação orientada a objetos - Herança",
      description:
        "Tenho dúvidas sobre herança múltipla e como resolver conflitos de métodos. Preciso de exemplos práticos em Java.",
      subject: "Programação Orientada a Objetos",
      priority: "media",
      estimatedHours: 2,
      availableForChat: true,
      period: "3",
      course: "Engenharia de Software",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: "pendente",
      author: {
        name: "Carlos Silva",
        rating: 4.0,
        isCurrentUser: false,
      },
    },
    {
      id: 5,
      title: "Dúvida sobre React Hooks",
      description:
        "Estou com dificuldade para entender o useEffect e quando usar as dependências. Preciso de exemplos práticos de como implementar corretamente.",
      subject: "Desenvolvimento Web",
      priority: "media",
      estimatedHours: 1,
      availableForChat: true,
      period: "6",
      course: "Engenharia de Software",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: "pendente",
      author: {
        name: "João Silva",
        rating: 4.7,
        isCurrentUser: true,
      },
    },
    {
      id: 6,
      title: "Algoritmos de ordenação",
      description:
        "Preciso entender melhor a diferença entre quicksort e mergesort. Quando usar cada um?",
      subject: "Algoritmos e Estruturas de Dados",
      priority: "alta",
      estimatedHours: 2,
      availableForChat: true,
      period: "6",
      course: "Engenharia de Software",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      status: "em-andamento",
      author: {
        name: "João Silva",
        rating: 4.7,
        isCurrentUser: true,
      },
    },
    {
      id: 7,
      title: "Padrões de projeto - Observer",
      description:
        "Como implementar o padrão Observer em JavaScript? Preciso de um exemplo prático.",
      subject: "Engenharia de Software",
      priority: "baixa",
      estimatedHours: 1,
      availableForChat: false,
      period: "6",
      course: "Engenharia de Software",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "resolvida",
      author: {
        name: "João Silva",
        rating: 4.7,
        isCurrentUser: true,
      },
    },
  ])

  const addRequest = (requestData: Omit<HelpRequest, "id" | "author">) => {
    const newRequest: HelpRequest = {
      ...requestData,
      id: Math.max(...requests.map(r => r.id)) + 1,
      author: {
        name: "João Silva",
        rating: 4.7,
        isCurrentUser: true,
      },
    }
    setRequests(prev => [newRequest, ...prev])
  }

  const updateRequest = (id: number, requestData: Partial<Omit<HelpRequest, "id" | "author">>) => {
    setRequests(prev => 
      prev.map(request => 
        request.id === id ? { ...request, ...requestData } : request
      )
    )
  }

  const updateRequestStatus = (id: number, status: HelpRequest["status"]) => {
    setRequests(prev => 
      prev.map(request => 
        request.id === id ? { ...request, status } : request
      )
    )
  }

  const deleteRequest = (id: number) => {
    setRequests(prev => prev.filter(request => request.id !== id))
  }

  const getUserRequests = () => {
    return requests.filter(request => request.author.isCurrentUser)
  }

  return (
    <HelpRequestsContext.Provider value={{
      requests,
      addRequest,
      updateRequest,
      updateRequestStatus,
      deleteRequest,
      getUserRequests,
    }}>
      {children}
    </HelpRequestsContext.Provider>
  )
}

export function useHelpRequests() {
  const context = useContext(HelpRequestsContext)
  if (context === undefined) {
    throw new Error("useHelpRequests must be used within a HelpRequestsProvider")
  }
  return context
}


