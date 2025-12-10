"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Users, MessageCircle, Trophy, Clock, Star, Sparkles, TrendingUp, Lock } from "lucide-react"
import { useHelpRequests } from "@/lib/help-requests-context"
import { useAuth, useFormatDate, useStatusColors } from "@/hooks"
import { dashboardStyles } from "./components/style"
import { AuthGuard } from "@/components/auth-guard"

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

function DashboardPageContent() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [ajudasSolicitadas, setAjudasSolicitadas] = useState<number>(0)
  const [ajudasPrestadas, setAjudasPrestadas] = useState<number>(0)
  const [avaliacaoMedia, setAvaliacaoMedia] = useState<number | null>(null)
  const [totalAvaliacoes, setTotalAvaliacoes] = useState<number>(0)
  const [recentUserRequests, setRecentUserRequests] = useState<Array<{
    id: number
    subject: string
    title: string
    priority: "baixa" | "media" | "alta"
    status: "pendente" | "em-andamento" | "resolvida"
    time: string
  }>>([])
  const router = useRouter()
  const { getUserRequests } = useHelpRequests()
  const userRequests = getUserRequests()
  const { user } = useAuth()
  const { formatTimeAgo } = useFormatDate()
  const { getStatusIcon } = useStatusColors()
  
  const userName = user?.USU_NOME?.split(' ')[0] || "Usuário"

  // Buscar quantidade de ajudas solicitadas do usuário
  useEffect(() => {
    const fetchAjudasSolicitadas = async () => {
      if (!user?.USU_ID) return

      try {
        const usuarioId = typeof user.USU_ID === 'string' ? parseInt(user.USU_ID) : user.USU_ID
        const response = await fetch(`/api/duvidas/count?usuarioId=${usuarioId}`)
        const data = await response.json()

        if (data.ok) {
          const count = Number(data.count) || 0
          setAjudasSolicitadas(count)
        } else {
          console.error('Erro na resposta da API de dúvidas:', data.error)
        }
      } catch (error) {
        console.error('Erro ao buscar quantidade de ajudas solicitadas:', error)
      }
    }

    fetchAjudasSolicitadas()
  }, [user?.USU_ID])

  // Buscar quantidade de ajudas prestadas do usuário
  useEffect(() => {
    const fetchAjudasPrestadas = async () => {
      if (!user?.USU_ID) return

      try {
        const usuarioId = typeof user.USU_ID === 'string' ? parseInt(user.USU_ID) : user.USU_ID
        const response = await fetch(`/api/respostas/count?usuarioId=${usuarioId}`)
        const data = await response.json()

        if (data.ok) {
          const count = Number(data.count) || 0
          setAjudasPrestadas(count)
        } else {
          console.error('Erro na resposta da API de respostas:', data.error)
        }
      } catch (error) {
        console.error('Erro ao buscar quantidade de ajudas prestadas:', error)
      }
    }

    fetchAjudasPrestadas()
  }, [user?.USU_ID])

  // Buscar avaliação média do usuário
  useEffect(() => {
    const fetchAvaliacaoMedia = async () => {
      if (!user?.USU_ID) return

      try {
        const usuarioId = typeof user.USU_ID === 'string' ? parseInt(user.USU_ID) : user.USU_ID
        const response = await fetch(`/api/usuarios/avaliacoes?usuarioId=${usuarioId}`)
        const data = await response.json()

        if (data.ok && data.resumo) {
          if (data.resumo.media !== null && data.resumo.media !== undefined) {
            setAvaliacaoMedia(data.resumo.media)
          } else {
            setAvaliacaoMedia(null)
          }
          setTotalAvaliacoes(data.resumo.total || 0)
        } else {
          setAvaliacaoMedia(null)
          setTotalAvaliacoes(0)
        }
      } catch (error) {
        console.error('Erro ao buscar avaliação média:', error)
        setAvaliacaoMedia(null)
      }
    }

    fetchAvaliacaoMedia()
  }, [user?.USU_ID])

  // Buscar as 3 últimas dúvidas do usuário
  useEffect(() => {
    const fetchUserDuvidas = async () => {
      if (!user?.USU_ID) return

      try {
        const response = await fetch('/api/duvidas')
        const data = await response.json()

        if (data.ok && data.duvidas) {
          // Converter USU_ID para número para comparação
          const usuarioId = typeof user.USU_ID === 'string' ? parseInt(user.USU_ID, 10) : Number(user.USU_ID)
          
          // Filtrar apenas as dúvidas do usuário atual
          // Garantir que ambos os IDs sejam comparados como números
          const userDuvidas = data.duvidas
            .filter((duvida: DuvidaFromAPI) => {
              const duvidaUsuarioId = typeof duvida.DUV_IDUSUARIO === 'string' 
                ? parseInt(duvida.DUV_IDUSUARIO, 10) 
                : Number(duvida.DUV_IDUSUARIO)
              return duvidaUsuarioId === usuarioId
            })
            .sort((a: DuvidaFromAPI, b: DuvidaFromAPI) => 
              new Date(b.DUV_DATADUVIDA).getTime() - new Date(a.DUV_DATADUVIDA).getTime()
            )
            .slice(0, 3)
            .map((duvida: DuvidaFromAPI) => ({
              id: duvida.DUV_IDDUVIDA,
              subject: duvida.MAT_DESC,
              title: duvida.DUV_TITULO,
              priority: "media" as const,
              status: duvida.DUV_RESOLVIDA ? "resolvida" as const : "pendente" as const,
              time: formatTimeAgo(duvida.DUV_DATADUVIDA),
            }))

          console.log('Dúvidas do usuário encontradas:', userDuvidas.length, userDuvidas)
          setRecentUserRequests(userDuvidas)
        } else {
          console.log('Nenhuma dúvida encontrada ou erro na resposta:', data)
        }
      } catch (error) {
        console.error('Erro ao buscar dúvidas do usuário:', error)
      }
    }

    fetchUserDuvidas()
  }, [user?.USU_ID])

  const stats = [
    {
      title: "Ajudas Solicitadas",
      value: ajudasSolicitadas.toString(),
      description: "Total",
      icon: BookOpen,
      color: "text-primary",
    },
    {
      title: "Ajudas Prestadas",
      value: ajudasPrestadas.toString(),
      description: "Total",
      icon: Users,
      color: "text-secondary",
    },
    {
      title: "Horas Acumuladas",
      value: "EM DESENVOLVIMENTO",
      description: "Em breve",
      icon: Clock,
      color: "text-accent",
    },
    {
      title: "Avaliação Média",
      value: avaliacaoMedia !== null ? avaliacaoMedia.toFixed(1) : "—",
      description: "De 5.0",
      icon: Star,
      color: "text-chart-5",
    },
  ]




  const handleSolicitarAjuda = () => {
    router.push("/solicitacoes/1?nova=true")
  }

  const handleVerTodasSolicitacoes = () => {
    router.push("/solicitacoes/1?minhas=true")
  }

  const handleClickRequest = () => {
    router.push("/solicitacoes?minhas=true")
  }

  return (
    <div className={dashboardStyles.container}>
      {/* Background Elements */}
      <div className={dashboardStyles.background}>
        <div className={dashboardStyles.gradient1}></div>
        <div className={dashboardStyles.gradient2}></div>
        <div className={dashboardStyles.gradient3}></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className={dashboardStyles.main}>
        <div className={dashboardStyles.content}>
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                <div className="p-3 rounded-2xl gradient-primary pulse-glow">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Bem-vindo de volta, {userName || "Usuário"}!
                  </h1>
                  <p className="text-xl text-muted-foreground">Aqui está um resumo da sua atividade na plataforma.</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                const gradients = ["gradient-primary", "gradient-secondary", "gradient-accent", "gradient-full"]
                return (
                  <Card key={stat.title} className="modern-card border-0 hover:scale-105 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">{stat.title}</CardTitle>
                      <div className={`p-2 rounded-xl ${gradients[index]}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stat.title === "Avaliação Média" && totalAvaliacoes > 0 && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'}
                        </p>
                      )}
                      <div className={stat.value === "EM DESENVOLVIMENTO" ? "text-sm font-semibold text-muted-foreground mb-1" : "text-3xl font-bold mb-1"}>
                        {stat.value}
                      </div>
                      <p className="text-sm text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Requests */}
              <Card className="modern-card border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl gradient-primary">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    Solicitações Recentes
                  </CardTitle>
                  <CardDescription className="text-base">Suas últimas solicitações de ajuda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentUserRequests.length > 0 ? (
                    <>
                      {recentUserRequests.map((request) => (
                        <div 
                          key={request.id} 
                          className="modern-card p-4 rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                          onClick={handleClickRequest}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">{getStatusIcon(request.status)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-base truncate">{request.title}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{request.subject}</p>
                              <p className="text-xs text-muted-foreground">{request.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Você ainda não fez nenhuma solicitação
                    </p>
                  )}
                  <Button 
                    className="w-full modern-button rounded-xl h-12 text-base font-semibold"
                    onClick={handleVerTodasSolicitacoes}
                  >
                    Ver Minhas Solicitações
                  </Button>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="modern-card border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl gradient-full">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    Conquistas
                  </CardTitle>
                  <CardDescription className="text-base">Seu progresso na plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-xl bg-muted/50 mb-4">
                      <Trophy className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-semibold text-muted-foreground">EM DESENVOLVIMENTO</p>
                    <p className="text-sm text-muted-foreground mt-2">Esta funcionalidade estará disponível em breve</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="modern-card border-0">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-xl gradient-accent">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Ações Rápidas
                </CardTitle>
                <CardDescription className="text-lg">O que você gostaria de fazer agora?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Button 
                    className="h-24 flex-col gap-3 modern-button rounded-2xl text-base font-semibold hover:scale-105 transition-all duration-300" 
                    onClick={handleSolicitarAjuda}
                  >
                    <div className="p-3 rounded-xl bg-white/20">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    Solicitar Ajuda
                  </Button>
                  <Button 
                    className="h-24 flex-col gap-3 gradient-secondary text-white border-0 rounded-2xl text-base font-semibold opacity-50 cursor-not-allowed" 
                    disabled
                  >
                    <div className="p-3 rounded-xl bg-white/20 flex items-center justify-center gap-2">
                      <Users className="h-8 w-8" />
                      <Lock className="h-4 w-4" />
                    </div>
                    Oferecer Ajuda
                  </Button>
                  <Button 
                    className="h-24 flex-col gap-3 gradient-accent text-white border-0 rounded-2xl text-base font-semibold opacity-50 cursor-not-allowed" 
                    disabled
                  >
                    <div className="p-3 rounded-xl bg-white/20 flex items-center justify-center gap-2">
                      <MessageCircle className="h-8 w-8" />
                      <Lock className="h-4 w-4" />
                    </div>
                    Abrir Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPageContent />
    </AuthGuard>
  )
}

