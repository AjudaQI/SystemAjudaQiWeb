"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, User, MessageCircle, Search, Filter, Edit, Trash2, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { useFormatDate, useStatusColors, useAuth } from "@/hooks"
import { useToast } from "@/components/ui/use-toast"
import { solicitacoesStyles } from "@/app/solicitacoes/style"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AuthGuard } from "@/components/auth-guard"

interface Materia {
  MAT_ID: number
  MAT_DESC: string
  MAT_IDCURSO: number
  MAT_IDPERIODO: number
  PER_DESCRICAO: string
}

interface DuvidaFromAPI {
  DUV_IDDUVIDA: number
  DUV_TITULO: string
  DUV_DESCRICAO: string
  DUV_DATADUVIDA: string
  DUV_RESOLVIDA: boolean
  DUV_IDUSUARIO: number
  DUV_IDMATERIA: number
  MAT_DESC: string
  MATERIA_PERIODO_DESC: string
  USU_NOME: string
  USU_EMAIL: string
  USUARIO_CURSO_DESC: string | null
  USUARIO_PERIODO_DESC: string | null
}

interface ResponseFromAPI {
  RES_IDRESPOSTA: number
  RES_IDDUVIDA: number
  RES_IDUSUARIO: number
  RES_DESCRICAO: string
  RES_DATARESPOSTA: string
  RES_MELHORRESPOSTA: boolean
  USU_NOME: string
  USU_AVALIACAO?: number | null
  USUARIO_CURSO_DESC: string | null
  USUARIO_PERIODO_DESC: string | null
  MEDIA_AVALIACAO: number | null
  TOTAL_AVALIACOES: number | null
  USUARIO_AVALIACAO: number | null
}

interface HelpRequest {
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
    course?: string | null
    period?: string | null
  }
}

export function SolicitacoesPageContent() {
  const searchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()
  const pageNumber = params?.page ? parseInt(params.page as string, 10) : 1
  const [activeSection, setActiveSection] = useState("help-requests")
  const [showForm, setShowForm] = useState(false)
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [editingRequest, setEditingRequest] = useState<HelpRequest | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { formatTimeAgo } = useFormatDate()
  const { getPriorityIcon, getPriorityColor } = useStatusColors()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [formData, setFormData] = useState({
    subject: "",
    title: "",
    description: "",
    priority: "media" as "baixa" | "media" | "alta",
    estimatedHours: 1,
    availableForChat: true,
    period: "6",
  })

  const currentUserPeriod = 6 // Usuário está no 6º período
  const [materias, setMaterias] = useState<Materia[]>([])
  const [loadingMaterias, setLoadingMaterias] = useState(false)
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [respondingRequestId, setRespondingRequestId] = useState<number | null>(null)
  const [responseText, setResponseText] = useState("")
  const [isSendingResponse, setIsSendingResponse] = useState(false)
  const [responsesByRequest, setResponsesByRequest] = useState<Record<number, ResponseFromAPI[]>>({})
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [ratingLoadingId, setRatingLoadingId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<HelpRequest | null>(null)
  const [editingResponseId, setEditingResponseId] = useState<number | null>(null)
  const [editingResponseText, setEditingResponseText] = useState("")
  const [isEditingResponse, setIsEditingResponse] = useState(false)
  const [deleteResponseDialogOpen, setDeleteResponseDialogOpen] = useState(false)
  const [responseToDelete, setResponseToDelete] = useState<number | null>(null)

  // Verificar query parameters
  useEffect(() => {
    const minhas = searchParams.get('minhas')
    if (minhas === 'true') {
      setShowMyRequests(true)
    }

    const nova = searchParams.get('nova')
    if (nova === 'true') {
      setEditingRequest(null)
      setShowForm(true)
    }
  }, [searchParams])

  // Buscar dúvidas do banco de dados
  useEffect(() => {
    const fetchDuvidas = async () => {
      setLoadingRequests(true)
      try {
        const response = await fetch('/api/duvidas')
        const data = await response.json()

        if (data.ok && data.duvidas) {
          // Converter USU_ID para número para comparação
          const currentUserId = user?.USU_ID 
            ? (typeof user.USU_ID === 'string' ? parseInt(user.USU_ID, 10) : Number(user.USU_ID))
            : null
          
          const mappedRequests = data.duvidas.map((duvida: DuvidaFromAPI) => {
            // Extrair número do período da descrição (ex: "6º Período" -> "6")
            const periodoMatch = duvida.MATERIA_PERIODO_DESC?.match(/^(\d+)/)
            const periodoNum = periodoMatch ? periodoMatch[1] : "1"
            
            // Garantir que ambos os IDs sejam comparados como números
            const duvidaUsuarioId = typeof duvida.DUV_IDUSUARIO === 'string'
              ? parseInt(duvida.DUV_IDUSUARIO, 10)
              : Number(duvida.DUV_IDUSUARIO)
            const isCurrentUser = currentUserId !== null && duvidaUsuarioId === currentUserId

            return {
              id: duvida.DUV_IDDUVIDA,
              title: duvida.DUV_TITULO,
              description: duvida.DUV_DESCRICAO,
              subject: duvida.MAT_DESC,
              priority: "media" as const,
              estimatedHours: 1,
              availableForChat: false,
              period: periodoNum,
              course: duvida.USUARIO_CURSO_DESC || "Curso não informado",
              createdAt: duvida.DUV_DATADUVIDA,
              status: duvida.DUV_RESOLVIDA ? "resolvida" as const : "pendente" as const,
              author: {
                name: duvida.USU_NOME,
                isCurrentUser,
                course: duvida.USUARIO_CURSO_DESC,
                period: duvida.USUARIO_PERIODO_DESC,
              },
            }
          })
          setRequests(mappedRequests)
        } else {
          console.error('Erro ao buscar dúvidas:', data.error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar as solicitações",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erro ao buscar dúvidas:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar solicitações do banco de dados",
          variant: "destructive"
        })
      } finally {
        setLoadingRequests(false)
      }
    }

    fetchDuvidas()
  }, [user, toast])

  const fetchRespostas = useCallback(async () => {
    if (!user?.USU_ID) {
      setResponsesByRequest({})
      return
    }

    setLoadingResponses(true)
    try {
      const usuarioIdNumber =
        typeof user.USU_ID === 'string' ? parseInt(user.USU_ID, 10) : Number(user.USU_ID)
      const response = await fetch(`/api/respostas?usuarioId=${usuarioIdNumber}`)
      const data = await response.json()

      if (data.ok && data.respostas) {
        const grouped = data.respostas.reduce((acc: Record<number, ResponseFromAPI[]>, resposta: ResponseFromAPI) => {
          if (!acc[resposta.RES_IDDUVIDA]) {
            acc[resposta.RES_IDDUVIDA] = []
          }
          acc[resposta.RES_IDDUVIDA].push(resposta)
          return acc
        }, {})

        setResponsesByRequest(grouped)
      } else {
        console.error('Erro ao buscar respostas:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar respostas:', error)
    } finally {
      setLoadingResponses(false)
    }
  }, [user?.USU_ID])

  useEffect(() => {
    fetchRespostas()
  }, [fetchRespostas])

  // Buscar matérias do banco de dados
  useEffect(() => {
    const fetchMaterias = async () => {
      setLoadingMaterias(true)
      try {
        // Buscar TODAS as matérias, independente do curso do usuário
        const response = await fetch('/api/materias')
        const data = await response.json()

        if (data.ok) {
          console.log('Resposta da API:', data)
          setMaterias(data.materias || [])
          console.log('Matérias carregadas:', data.materias?.length || 0, data.materias)
        } else {
          console.error('Erro ao buscar matérias:', data.error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar as matérias",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erro ao buscar matérias:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar matérias do banco de dados",
          variant: "destructive"
        })
      } finally {
        setLoadingMaterias(false)
      }
    }

    fetchMaterias()
  }, [])

  // Lista de todas as matérias (sem filtro de período) - remover duplicatas
  const subjects = [...new Set(materias.map(m => m.MAT_DESC))]

  // Função para obter o período de uma matéria
  const getPeriodoByMateria = (materiaDesc: string): string | null => {
    const materia = materias.find(m => m.MAT_DESC === materiaDesc)
    if (!materia) return null
    
    // Extrair número do período da descrição (ex: "6º Período" -> "6")
    const periodoMatch = materia.PER_DESCRICAO.match(/^(\d+)/)
    return periodoMatch ? periodoMatch[1] : null
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.USU_ID) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma solicitação",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const usuarioId = typeof user.USU_ID === 'string' 
        ? parseInt(user.USU_ID) 
        : user.USU_ID

      // Se estiver editando, usar PUT, senão usar POST
      const method = editingRequest ? 'PUT' : 'POST'
      const body = editingRequest
        ? {
            duvidaId: editingRequest.id,
            usuarioId: usuarioId,
            materiaDesc: formData.subject,
            periodoNum: formData.period,
            titulo: formData.title,
            descricao: formData.description,
          }
        : {
            materiaDesc: formData.subject,
            periodoNum: formData.period,
            titulo: formData.title,
            descricao: formData.description,
            usuarioId: usuarioId
          }

      const response = await fetch('/api/duvidas', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || (editingRequest ? 'Erro ao atualizar solicitação' : 'Erro ao criar solicitação'))
      }

      // Recarregar as dúvidas do banco de dados
      const duvidasResponse = await fetch('/api/duvidas')
      const duvidasData = await duvidasResponse.json()

      if (duvidasData.ok && duvidasData.duvidas) {
        const currentUserId = user?.USU_ID 
          ? (typeof user.USU_ID === 'string' ? parseInt(user.USU_ID, 10) : Number(user.USU_ID))
          : null
        
        const mappedRequests = duvidasData.duvidas.map((duvida: DuvidaFromAPI) => {
          const periodoMatch = duvida.MATERIA_PERIODO_DESC?.match(/^(\d+)/)
          const periodoNum = periodoMatch ? periodoMatch[1] : "1"
          
          // Garantir que ambos os IDs sejam comparados como números
          const duvidaUsuarioId = typeof duvida.DUV_IDUSUARIO === 'string'
            ? parseInt(duvida.DUV_IDUSUARIO, 10)
            : Number(duvida.DUV_IDUSUARIO)
          const isCurrentUser = currentUserId !== null && duvidaUsuarioId === currentUserId

          return {
            id: duvida.DUV_IDDUVIDA,
            title: duvida.DUV_TITULO,
            description: duvida.DUV_DESCRICAO,
            subject: duvida.MAT_DESC,
            priority: "media" as const,
            estimatedHours: 1,
            availableForChat: false,
            period: periodoNum,
            course: duvida.USUARIO_CURSO_DESC || "Curso não informado",
            createdAt: duvida.DUV_DATADUVIDA,
            status: duvida.DUV_RESOLVIDA ? "resolvida" as const : "pendente" as const,
            author: {
              name: duvida.USU_NOME,
              rating: 4.5,
              isCurrentUser,
              course: duvida.USUARIO_CURSO_DESC,
              period: duvida.USUARIO_PERIODO_DESC,
            },
          }
        })
        setRequests(mappedRequests)
      }

      toast({
        title: "Sucesso",
        description: editingRequest ? "Solicitação atualizada com sucesso" : "Solicitação criada com sucesso"
      })

      setShowForm(false)
      setEditingRequest(null)
      setFormData({
        subject: "",
        title: "",
        description: "",
        priority: "media",
        estimatedHours: 1,
        availableForChat: true,
        period: "6",
      })
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar solicitação",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHelpRequest = (request: HelpRequest) => {
    if (!user?.USU_ID) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para ajudar em uma solicitação",
        variant: "destructive"
      })
      return
    }

    if (respondingRequestId === request.id) {
      setRespondingRequestId(null)
      setResponseText("")
      return
    }

    setRespondingRequestId(request.id)
    setResponseText("")
  }

  const handleRateResponse = async (respostaId: number, rating: number) => {
    if (!user?.USU_ID) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para avaliar uma resposta",
        variant: "destructive"
      })
      return
    }

    // Verificar se o usuário já avaliou esta resposta para mostrar mensagem apropriada
    const resposta = Object.values(responsesByRequest).flat().find(r => r.RES_IDRESPOSTA === respostaId)
    
    // BLOQUEAR: Verificar se o usuário está tentando avaliar sua própria resposta
    if (resposta) {
      const currentUserId = typeof user.USU_ID === 'string'
        ? parseInt(user.USU_ID, 10)
        : Number(user.USU_ID)
      
      // Converter ambos para número para comparação correta
      const respostaUserId = typeof resposta.RES_IDUSUARIO === 'string'
        ? parseInt(resposta.RES_IDUSUARIO, 10)
        : Number(resposta.RES_IDUSUARIO)
      
      if (respostaUserId === currentUserId) {
        toast({
          title: "Avaliação não permitida",
          description: "Você não pode avaliar sua própria resposta",
          variant: "destructive"
        })
        return
      }
    }
    
    const jaAvaliou = resposta && resposta.USUARIO_AVALIACAO !== null && resposta.USUARIO_AVALIACAO !== undefined

    setRatingLoadingId(respostaId)

    try {
      const usuarioId = typeof user.USU_ID === 'string'
        ? parseInt(user.USU_ID)
        : user.USU_ID

      const response = await fetch('/api/respostas/avaliacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respostaId,
          usuarioId,
          estrela: rating,
        }),
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || "Erro ao avaliar resposta")
      }

      toast({
        title: data.updated ? "Avaliação atualizada" : "Avaliação registrada",
        description: data.updated 
          ? "Sua avaliação foi atualizada com sucesso!" 
          : "Obrigado por avaliar a resposta!",
      })

      // Recarregar todas as respostas para garantir dados atualizados
      await fetchRespostas()

      // Disparar evento para atualizar horas na sidebar
      window.dispatchEvent(new CustomEvent('responseRated'))
    } catch (error) {
      console.error('Erro ao avaliar resposta:', error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao avaliar resposta"
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setRatingLoadingId(null)
    }
  }

  const handleEditRequest = (request: any) => {
    setEditingRequest(request)
    setFormData({
      subject: request.subject || "",
      title: request.title || "",
      description: request.description || "",
      priority: request.priority || "media",
      estimatedHours: request.estimatedHours || 1,
      availableForChat: request.availableForChat ?? true,
      period: request.period || "6",
    })
    setShowForm(true)
  }

  const handleDeleteRequest = (request: HelpRequest) => {
    setRequestToDelete(request)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteRequest = async () => {
    if (!requestToDelete || !user?.USU_ID) return

    try {
      const usuarioId = typeof user.USU_ID === 'string' ? parseInt(user.USU_ID) : user.USU_ID

      const response = await fetch('/api/duvidas', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duvidaId: requestToDelete.id,
          usuarioId,
        }),
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || "Erro ao excluir solicitação")
      }

      // Remover do estado local
      setRequests(prev => prev.filter(r => r.id !== requestToDelete.id))
      
      // Remover respostas relacionadas
      setResponsesByRequest(prev => {
        const updated = { ...prev }
        delete updated[requestToDelete.id]
        return updated
      })

      toast({
        title: "Sucesso",
        description: "Solicitação excluída com sucesso"
      })
      setDeleteDialogOpen(false)
      setRequestToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir solicitação",
        variant: "destructive"
      })
    }
  }

  const handleCancelResponse = () => {
    setRespondingRequestId(null)
    setResponseText("")
  }

  const handleEditResponse = (resposta: ResponseFromAPI) => {
    setEditingResponseId(resposta.RES_IDRESPOSTA)
    setEditingResponseText(resposta.RES_DESCRICAO)
  }

  const handleCancelEditResponse = () => {
    setEditingResponseId(null)
    setEditingResponseText("")
  }

  const handleSaveEditResponse = async () => {
    if (!editingResponseId || !editingResponseText.trim()) {
      toast({
        title: "Ops",
        description: "Digite uma resposta antes de salvar",
        variant: "destructive"
      })
      return
    }

    if (!user?.USU_ID) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para editar uma resposta",
        variant: "destructive"
      })
      return
    }

    setIsEditingResponse(true)

    try {
      const usuarioId = typeof user.USU_ID === 'string'
        ? parseInt(user.USU_ID)
        : user.USU_ID

      const response = await fetch('/api/respostas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respostaId: editingResponseId,
          usuarioId,
          descricao: editingResponseText.trim(),
        }),
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || "Erro ao editar resposta")
      }

      toast({
        title: "Sucesso",
        description: "Resposta editada com sucesso!",
      })

      // Recarregar todas as respostas
      await fetchRespostas()

      // Limpar estado de edição
      setEditingResponseId(null)
      setEditingResponseText("")
    } catch (error) {
      console.error('Erro ao editar resposta:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao editar resposta",
        variant: "destructive"
      })
    } finally {
      setIsEditingResponse(false)
    }
  }

  const handleDeleteResponse = (respostaId: number) => {
    setResponseToDelete(respostaId)
    setDeleteResponseDialogOpen(true)
  }

  const confirmDeleteResponse = async () => {
    if (!responseToDelete || !user?.USU_ID) {
      return
    }

    try {
      const usuarioId = typeof user.USU_ID === 'string'
        ? parseInt(user.USU_ID)
        : user.USU_ID

      const response = await fetch('/api/respostas', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          respostaId: responseToDelete,
          usuarioId,
        }),
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || "Erro ao excluir resposta")
      }

      toast({
        title: "Sucesso",
        description: "Resposta excluída com sucesso!",
      })

      // Recarregar todas as respostas
      await fetchRespostas()

      // Limpar estado
      setDeleteResponseDialogOpen(false)
      setResponseToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir resposta:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir resposta",
        variant: "destructive"
      })
    }
  }

  // Calcular rating final usando fórmula ponderada: rating_final = (v/(v+m)) * media + (m/(v+m)) * media_global
  // A constante 'm' determina quantas avaliações são necessárias para confiar na média própria
  // Valores maiores de 'm' dão mais peso ao número de avaliações
  const calculateRatingFinal = (
    media: number | null,
    totalAvaliacoes: number | null,
    mediaGlobal: number
  ): number => {
    // Se não tem avaliações, retorna um valor muito baixo para que fique por último na ordenação
    if (!media || totalAvaliacoes === null || totalAvaliacoes === 0) {
      return -1 // Valor negativo para garantir que respostas sem avaliações fiquem por último
    }

    const v = totalAvaliacoes // número de avaliações
    // Constante 'm' maior = mais peso no número de avaliações
    // Com m=100: resposta com 1 avaliação tem apenas 1% de peso na própria média (99% média global)
    //             resposta com 2 avaliações tem 2% de peso na própria média (98% média global)
    //             resposta com 5 avaliações tem 5% de peso na própria média (95% média global)
    //             resposta com 10 avaliações tem 9% de peso na própria média (91% média global)
    // Isso garante que respostas com mais avaliações sejam priorizadas
    // Exemplo com média global = 4.0:
    //   - 5 estrelas (1 voto): (1/101)*5 + (100/101)*4 = 0.0495 + 3.9604 = 4.0099
    //   - 4.5 estrelas (2 votos): (2/102)*4.5 + (100/102)*4 = 0.0882 + 3.9216 = 4.0098
    // Com m=100, respostas com mais votos ganham quando a diferença de média é pequena (0.5 estrelas)
    // Se a diferença de média for maior (ex: 1 estrela), a resposta com maior média ainda pode ganhar
    // Com m=150, respostas com 1 avaliação têm apenas 0.66% de peso na própria média
    // Respostas com 2 avaliações têm 1.32% de peso na própria média
    // Isso garante que respostas com mais avaliações sempre ganhem quando a diferença de média é pequena
    const m = 150 // constante de suavização (Bayesian average) - valor muito alto para priorizar número de avaliações
    
    // Fórmula: quanto mais avaliações (v), mais confiança na média própria
    // Respostas com poucas avaliações são "puxadas" para a média global
    const ratingFinal = (v / (v + m)) * media + (m / (v + m)) * mediaGlobal
    return ratingFinal
  }

  // Calcular média global de TODAS as respostas do sistema (não apenas da pergunta)
  const getGlobalAverage = (): number => {
    // Pegar todas as respostas de todas as perguntas
    const allResponses = Object.values(responsesByRequest).flat()
    
    if (allResponses.length === 0) return 3.0 // valor padrão conservador se não houver respostas

    // Calcular média ponderada: somar todas as avaliações e dividir pelo total
    let totalSum = 0
    let totalCount = 0

    allResponses.forEach(response => {
      if (response.MEDIA_AVALIACAO !== null && 
          response.TOTAL_AVALIACOES !== null && 
          response.TOTAL_AVALIACOES > 0) {
        // Somar todas as avaliações desta resposta
        totalSum += response.MEDIA_AVALIACAO * response.TOTAL_AVALIACOES
        totalCount += response.TOTAL_AVALIACOES
      }
    })

    if (totalCount === 0) return 3.0

    // Média global = soma de todas as avaliações / total de avaliações
    const mediaCalculada = totalSum / totalCount
    
    // Se há poucas avaliações no sistema, usar uma média mais conservadora
    // para garantir que respostas com mais avaliações sejam priorizadas
    if (totalCount < 10) {
      // Usar média entre a calculada e 3.0 (valor médio) para ser mais conservador
      return (mediaCalculada + 3.0) / 2
    }
    
    return mediaCalculada
  }

  // Ordenar respostas por rating final (melhor primeiro)
  const getSortedResponses = (requestId: number): ResponseFromAPI[] => {
    const responses = responsesByRequest[requestId] || []
    if (responses.length === 0) return []

    // Usar média global de TODAS as respostas do sistema
    const mediaGlobal = getGlobalAverage()

    return [...responses].sort((a, b) => {
      const avaliacoesA = a.TOTAL_AVALIACOES ?? 0
      const avaliacoesB = b.TOTAL_AVALIACOES ?? 0
      
      // Primeiro: priorizar respostas com avaliações sobre respostas sem avaliações
      if (avaliacoesA === 0 && avaliacoesB > 0) {
        return 1 // b vem primeiro
      }
      if (avaliacoesB === 0 && avaliacoesA > 0) {
        return -1 // a vem primeiro
      }
      
      const ratingA = calculateRatingFinal(
        a.MEDIA_AVALIACAO,
        a.TOTAL_AVALIACOES,
        mediaGlobal
      )
      const ratingB = calculateRatingFinal(
        b.MEDIA_AVALIACAO,
        b.TOTAL_AVALIACOES,
        mediaGlobal
      )

      // Se a diferença de rating é muito pequena (menos de 0.1), priorizar resposta com mais avaliações
      if (Math.abs(ratingB - ratingA) < 0.1) {
        // Se uma tem mais avaliações, ela ganha
        if (avaliacoesB !== avaliacoesA) {
          return avaliacoesB - avaliacoesA
        }
      }

      // Ordenar por rating final (maior primeiro), depois por data (mais recente primeiro)
      if (Math.abs(ratingB - ratingA) > 0.01) {
        return ratingB - ratingA
      }
      
      // Se ratings são muito próximos, ordenar por data (mais recente primeiro)
      return new Date(b.RES_DATARESPOSTA).getTime() - new Date(a.RES_DATARESPOSTA).getTime()
    })
  }

  const handleSendResponse = async () => {
    if (!respondingRequestId) return

    if (!user?.USU_ID) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para enviar uma resposta",
        variant: "destructive"
      })
      return
    }

    if (!responseText.trim()) {
      toast({
        title: "Ops",
        description: "Digite uma resposta antes de enviar",
        variant: "destructive"
      })
      return
    }

    setIsSendingResponse(true)

    try {
      const usuarioId = typeof user.USU_ID === 'string'
        ? parseInt(user.USU_ID)
        : user.USU_ID

      const response = await fetch('/api/respostas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duvidaId: respondingRequestId,
          usuarioId,
          descricao: responseText.trim(),
        }),
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || "Erro ao enviar resposta")
      }

      // Atualizar lista local de respostas imediatamente
      const newResponse: ResponseFromAPI = {
        ...data.resposta,
        MEDIA_AVALIACAO: null,
        TOTAL_AVALIACOES: 0,
        USUARIO_AVALIACAO: null,
      }

      setResponsesByRequest(prev => {
        const currentResponses = prev[respondingRequestId] || []
        return {
          ...prev,
          [respondingRequestId]: [
            newResponse,
            ...currentResponses,
          ],
        }
      })

      toast({
        title: "Resposta enviada",
        description: "Sua oferta de ajuda foi registrada com sucesso",
      })

      setRespondingRequestId(null)
      setResponseText("")
    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar resposta",
        variant: "destructive"
      })
    } finally {
      setIsSendingResponse(false)
    }
  }


  // Filtrar apenas períodos iguais ou menores que o usuário atual
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || request.subject === subjectFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter
    const matchesPeriod = periodFilter === "all" || request.period === periodFilter
    const matchesPeriodRule = Number.parseInt(request.period) <= currentUserPeriod
    
    // Se o filtro "Minhas Solicitações" estiver ativo, mostrar apenas as do usuário logado
    const matchesMyRequests = !showMyRequests || request.author.isCurrentUser === true

    return matchesSearch && matchesSubject && matchesPriority && matchesPeriod && matchesPeriodRule && matchesMyRequests
  })

  // Paginação: 10 solicitações por página
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const currentPage = pageNumber > 0 && pageNumber <= totalPages ? pageNumber : 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  const uniqueSubjects = [...new Set(requests.map((r) => r.subject))]

  // Redirecionar se a página for inválida
  useEffect(() => {
    if (pageNumber !== currentPage && totalPages > 0) {
      router.push(`/solicitacoes/${currentPage}`)
    }
  }, [pageNumber, currentPage, totalPages, router])

  return (
    <div className={solicitacoesStyles.container}>
      {/* Background Elements */}
      <div className={solicitacoesStyles.background}>
        <div className={solicitacoesStyles.gradient1}></div>
        <div className={solicitacoesStyles.gradient2}></div>
        <div className={solicitacoesStyles.gradient3}></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className={solicitacoesStyles.main}>
        <div className={solicitacoesStyles.content}>
          {showForm ? (
            <div className="space-y-6">
              <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>{editingRequest ? "Editar Solicitação" : "Solicitar Ajuda"}</CardTitle>
                  <CardDescription>
                    {editingRequest 
                      ? "Edite os detalhes da sua solicitação de ajuda" 
                      : "Descreva sua dúvida e encontre colegas que podem te ajudar"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitRequest} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Matéria</Label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) => {
                            // Buscar o período da matéria selecionada e preencher automaticamente
                            const periodo = getPeriodoByMateria(value)
                            setFormData({ 
                              ...formData, 
                              subject: value,
                              period: periodo || formData.period
                            })
                          }}
                          required
                          disabled={loadingMaterias}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingMaterias 
                                ? "Carregando matérias..." 
                                : subjects.length === 0
                                  ? "Nenhuma matéria encontrada"
                                  : "Selecione a matéria"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.length > 0 && subjects.map((subject, index) => (
                              <SelectItem key={`subject-${index}-${subject}`} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!loadingMaterias && subjects.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma matéria disponível
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="period">Período da Matéria</Label>
                        <Select
                          value={formData.period}
                          onValueChange={(value) => {
                            // Se mudar o período manualmente, limpar a matéria se ela não for desse período
                            const materiaAtual = materias.find(m => m.MAT_DESC === formData.subject)
                            if (materiaAtual) {
                              const periodoMatch = materiaAtual.PER_DESCRICAO.match(/^(\d+)/)
                              const materiaPeriodo = periodoMatch ? periodoMatch[1] : null
                              if (materiaPeriodo !== value) {
                                setFormData({ ...formData, period: value, subject: "" })
                              } else {
                                setFormData({ ...formData, period: value })
                              }
                            } else {
                              setFormData({ ...formData, period: value })
                            }
                          }}
                          required
                          disabled={!formData.subject}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              formData.subject 
                                ? formData.period 
                                  ? `${formData.period}º Período`
                                  : "Período"
                                : "Selecione a matéria primeiro"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((period) => (
                              <SelectItem key={period} value={period.toString()}>
                                {period}º Período
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.subject && formData.period && (
                          <p className="text-xs text-muted-foreground">
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Título da Dúvida</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Dúvida sobre árvores binárias"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição Detalhada</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva sua dúvida em detalhes..."
                        className="min-h-[120px]"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        {isSubmitting 
                          ? "Salvando..." 
                          : editingRequest 
                            ? "Salvar Alterações" 
                            : "Solicitar Ajuda"
                        }
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowForm(false)
                          setEditingRequest(null)
                          setFormData({
                            subject: "",
                            title: "",
                            description: "",
                            priority: "media",
                            estimatedHours: 1,
                            availableForChat: true,
                            period: "6",
                          })
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Solicitações de Ajuda</h1>
                  <p className="text-muted-foreground">Encontre ajuda ou ofereça seu conhecimento para outros estudantes</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant={showMyRequests ? "default" : "outline"} 
                    onClick={() => setShowMyRequests(!showMyRequests)} 
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {showMyRequests ? "Todas as Solicitações" : "Minhas Solicitações"}
                  </Button>
                  <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Solicitação
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Buscar</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por título ou descrição..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Matéria</label>
                      <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as matérias</SelectItem>
                          {uniqueSubjects.map((subject, index) => (
                            <SelectItem key={`filter-subject-${index}-${subject}`} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prioridade</label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as prioridades</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="baixa">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Período</label>
                      <Select value={periodFilter} onValueChange={setPeriodFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os períodos</SelectItem>
                          {[1, 2, 3, 4, 5, 6].map((period) => (
                            <SelectItem key={period} value={period.toString()}>
                              {period}º Período
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Solicitações */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {loadingRequests ? "Carregando..." : `${filteredRequests.length} solicitação${filteredRequests.length !== 1 ? "ões" : ""} encontrada${filteredRequests.length !== 1 ? "s" : ""}`}
                    {showMyRequests && " (apenas suas)"}
                  </h3>
                </div>

                {loadingRequests ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground">Carregando solicitações...</p>
                    </CardContent>
                  </Card>
                ) : filteredRequests.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Search className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {showMyRequests ? "Você ainda não fez nenhuma solicitação" : "Nenhuma solicitação encontrada"}
                      </h3>
                      <p className="text-muted-foreground text-center">
                        {showMyRequests 
                          ? "Que tal criar sua primeira solicitação de ajuda?" 
                          : "Tente ajustar os filtros ou seja o primeiro a solicitar ajuda nesta matéria!"
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {paginatedRequests.map((request) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{request.period}º Período</Badge>
                            {request.availableForChat && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                Chat
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={request.author.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {request.author.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-semibold">{request.author.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {request.author.course || "Curso não informado"} • {request.author.period || "Período não informado"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                <p>{formatTimeAgo(request.createdAt)}</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <CardTitle className="text-base">{request.title}</CardTitle>
                              <CardDescription className="text-sm">{request.subject}</CardDescription>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {request.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                
                              </div>

                              <div className="flex gap-2">
                              {request.author.isCurrentUser ? (
                                // Botões para solicitações do próprio usuário
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleEditRequest(request)}
                                    className="flex items-center gap-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => handleDeleteRequest(request)}
                                    className="flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </Button>
                                </div>
                              ) : (
                                // Botões para solicitações de outros usuários
                                <div className="flex gap-2">
                                  {request.availableForChat && (
                                    <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent">
                                      <MessageCircle className="h-4 w-4" />
                                      Chat
                                    </Button>
                                  )}
                                  {respondingRequestId !== request.id && (
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleHelpRequest(request)}
                                      variant="default"
                                    >
                                      Ajudar
                                    </Button>
                                  )}
                                </div>
                              )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-4">
                            {respondingRequestId === request.id && (
                              <div className="space-y-3 rounded-md border p-4 bg-muted/40">
                                <Textarea
                                  placeholder="Explique como você pode ajudar..."
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  className="min-h-[100px]"
                                  disabled={isSendingResponse}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCancelResponse}
                                    disabled={isSendingResponse}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={handleSendResponse}
                                    disabled={isSendingResponse}
                                  >
                                    {isSendingResponse ? "Enviando..." : "Enviar resposta"}
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="space-y-3 border-t pt-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Respostas enviadas</span>
                                {loadingResponses && <span className="text-xs text-muted-foreground">Carregando...</span>}
                              </div>

                              {(responsesByRequest[request.id] || []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Nenhuma resposta ainda. Seja o primeiro a ajudar!
                                </p>
                              ) : (() => {
                                const sortedResponses = getSortedResponses(request.id)
                                const mediaGlobal = getGlobalAverage()
                                const responseCount = sortedResponses.length
                                // Calcular altura adaptativa: ~150px por resposta, máximo 400px
                                // Mínimo de altura para 1 resposta, máximo de 400px
                                const adaptiveHeight = Math.min(Math.max(responseCount * 150, 200), 400)
                                
                                return (
                                  <ScrollArea className="pr-4" style={{ height: `${adaptiveHeight}px`, maxHeight: '400px' }}>
                                    <div className="space-y-3">
                                      {sortedResponses.map((resposta, index) => {
                                        // Calcular rating final para exibir badge se for a melhor
                                        const ratingFinal = calculateRatingFinal(
                                          resposta.MEDIA_AVALIACAO,
                                          resposta.TOTAL_AVALIACOES,
                                          mediaGlobal
                                        )
                                        const topRating = sortedResponses.length > 0 
                                          ? calculateRatingFinal(
                                              sortedResponses[0].MEDIA_AVALIACAO,
                                              sortedResponses[0].TOTAL_AVALIACOES,
                                              mediaGlobal
                                            )
                                          : 0
                                        // Só mostrar badge se tiver avaliações e for realmente a melhor
                                        const hasAvaliacoes = resposta.TOTAL_AVALIACOES !== null && resposta.TOTAL_AVALIACOES > 0
                                        const isTopRated = index === 0 && 
                                          sortedResponses.length > 1 && 
                                          hasAvaliacoes &&
                                          Math.abs(ratingFinal - topRating) < 0.01 &&
                                          ratingFinal > 0 // Garantir que não é uma resposta sem avaliações

                                        return (
                                        <div key={resposta.RES_IDRESPOSTA} className="rounded-md border p-3 relative">
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-semibold flex items-center gap-1">
                                                  {resposta.USU_NOME}
                                                  {typeof resposta.USU_AVALIACAO === "number" && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                                      • ⭐ {resposta.USU_AVALIACAO.toFixed(1)}
                                                    </span>
                                                  )}
                                                </p>
                                                {isTopRated && sortedResponses.length > 1 && (
                                                  <Badge className="bg-yellow-500 text-white text-xs px-2 py-0.5">
                                                    ⭐ Melhor avaliada
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-xs text-muted-foreground">
                                                {resposta.USUARIO_CURSO_DESC || "Curso não informado"} • {resposta.USUARIO_PERIODO_DESC || "Período não informado"}
                                              </p>
                                            </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                          {formatTimeAgo(resposta.RES_DATARESPOSTA)}
                                        </span>
                                      </div>
                                      {editingResponseId === resposta.RES_IDRESPOSTA ? (
                                        <div className="mt-2 space-y-2">
                                          <Textarea
                                            value={editingResponseText}
                                            onChange={(e) => setEditingResponseText(e.target.value)}
                                            className="min-h-[100px]"
                                            disabled={isEditingResponse}
                                          />
                                          <div className="flex justify-end gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={handleCancelEditResponse}
                                              disabled={isEditingResponse}
                                            >
                                              Cancelar
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={handleSaveEditResponse}
                                              disabled={isEditingResponse}
                                            >
                                              {isEditingResponse ? "Salvando..." : "Salvar"}
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                                          {resposta.RES_DESCRICAO}
                                        </p>
                                      )}
                                      <div className="mt-3 flex flex-col gap-1 text-xs">
                                        {(() => {
                                          // Converter ambos para número para comparação correta e estrita
                                          const currentUserId = user?.USU_ID 
                                            ? (typeof user.USU_ID === 'string' ? parseInt(user.USU_ID, 10) : Number(user.USU_ID))
                                            : null
                                          const respostaUserId = typeof resposta.RES_IDUSUARIO === 'string' 
                                            ? parseInt(resposta.RES_IDUSUARIO, 10) 
                                            : Number(resposta.RES_IDUSUARIO)
                                          
                                          // BLOQUEAR: Não mostrar botões de avaliação se for a própria resposta
                                          // Usar comparação estrita com conversão explícita para garantir que funcione sempre
                                          const isOwnResponse = currentUserId !== null && 
                                            currentUserId !== undefined && 
                                            respostaUserId !== null && 
                                            respostaUserId !== undefined &&
                                            Number(currentUserId) === Number(respostaUserId)
                                          
                                          // Se for a própria resposta, mostrar botões de editar/excluir (apenas se não estiver editando)
                                          if (isOwnResponse && editingResponseId !== resposta.RES_IDRESPOSTA) {
                                            return (
                                              <div className="flex items-center justify-end gap-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => handleEditResponse(resposta)}
                                                  className="h-7 text-xs"
                                                >
                                                  <Edit className="h-3 w-3 mr-1" />
                                                  Editar
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="destructive"
                                                  onClick={() => handleDeleteResponse(resposta.RES_IDRESPOSTA)}
                                                  className="h-7 text-xs"
                                                >
                                                  <Trash2 className="h-3 w-3 mr-1" />
                                                  Excluir
                                                </Button>
                                              </div>
                                            )
                                          }
                                          
                                          // Mostrar botões apenas se NÃO for a própria resposta
                                          return (
                                              <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                  {[1, 2, 3, 4, 5].map((starValue) => {
                                                    const isActive = (resposta.USUARIO_AVALIACAO ?? 0) >= starValue
                                                    const jaAvaliou = resposta.USUARIO_AVALIACAO !== null && resposta.USUARIO_AVALIACAO !== undefined
                                                    return (
                                                      <button
                                                        key={starValue}
                                                        type="button"
                                                        onClick={() => handleRateResponse(resposta.RES_IDRESPOSTA, starValue)}
                                                        className="p-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                                                        title={jaAvaliou 
                                                          ? `Alterar avaliação para ${starValue} estrela${starValue > 1 ? "s" : ""}` 
                                                          : `Avaliar com ${starValue} estrela${starValue > 1 ? "s" : ""}`}
                                                        disabled={ratingLoadingId === resposta.RES_IDRESPOSTA}
                                                      >
                                                        <Star
                                                          className={`h-4 w-4 ${isActive ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                                        />
                                                      </button>
                                                    )
                                                  })}
                                                </div>
                                                {resposta.USUARIO_AVALIACAO !== null && resposta.USUARIO_AVALIACAO !== undefined && (
                                                  <span className="text-xs text-muted-foreground italic">
                                                    (Sua avaliação)
                                                  </span>
                                                )}
                                              </div>
                                            )
                                        })()}
                                        <div className="text-muted-foreground">
                                          {resposta.MEDIA_AVALIACAO
                                            ? `${Number(resposta.MEDIA_AVALIACAO).toFixed(1)} / 5`
                                            : "Ainda sem avaliações"}
                                          <span> • {resposta.TOTAL_AVALIACOES ?? 0} voto(s)</span>
                                        </div>
                                      </div>
                                    </div>
                                        )
                                      })}
                                    </div>
                                  </ScrollArea>
                                )
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Controles de Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/solicitacoes/${currentPage - 1}`)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Mostrar apenas algumas páginas ao redor da atual
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => router.push(`/solicitacoes/${page}`)}
                              className={page === currentPage ? "" : ""}
                            >
                              {page}
                            </Button>
                          )
                        } else if (
                          page === currentPage - 3 ||
                          page === currentPage + 3
                        ) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/solicitacoes/${currentPage + 1}`)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Página {currentPage} de {totalPages} • {filteredRequests.length} solicitação{filteredRequests.length !== 1 ? "ões" : ""} no total
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setRequestToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteRequest}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteResponseDialogOpen} onOpenChange={setDeleteResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta resposta? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteResponseDialogOpen(false)
                setResponseToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteResponse}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SolicitacoesPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirecionar /solicitacoes para /solicitacoes/1
    router.replace('/solicitacoes/1')
  }, [router])

  return null
}
