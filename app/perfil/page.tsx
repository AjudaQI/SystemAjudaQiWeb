"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trophy, Star, Clock, BookOpen, Users, MessageCircle, Calendar, Edit, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth, useFormatDate } from "@/hooks"
import { perfilStyles } from "@/app/perfil/style"
import { AuthGuard } from "@/components/auth-guard"

function PerfilPageContent() {
  const [activeSection, setActiveSection] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [ratingData, setRatingData] = useState<{
    media: number | null
    total: number
    avaliacoes: {
      AVA_ESTRELA: number
      AVA_IDRESPOSTA: number
      AVA_IDUSUARIO: number
      AVALIADOR_NOME: string
      RES_DESCRICAO: string
      RES_DATARESPOSTA: string
    }[]
  }>({
    media: null,
    total: 0,
    avaliacoes: [],
  })
  const [profileData, setProfileData] = useState({
    name: "Usuário",
    email: "",
    course: "",
    period: "",
    courseId: null as number | null,
    periodId: null as number | null,
    bio: "Estudante apaixonado por tecnologia, sempre disposto a ajudar colegas e aprender coisas novas. Especialista em algoritmos e estruturas de dados.",
    university: "Universidade Federal de Tecnologia",
    joinDate: "2023-03-15",
    specialties: ["Algoritmos", "Estruturas de Dados", "Programação"],
    preferredSubjects: ["Algoritmos e Estruturas de Dados"],
  })

  const cursos = [
    { id: 0, desc: "Engenharia de Software" },
    { id: 1, desc: "Medicina" },
    { id: 2, desc: "Administração" },
    { id: 3, desc: "Ciências Contábeis" },
    { id: 4, desc: "Psicologia" },
    { id: 5, desc: "Estética e Cosmético" },
    { id: 6, desc: "Odontologia" },
  ]

  const periodos = [
    { id: 1, desc: "1º Período" },
    { id: 2, desc: "2º Período" },
    { id: 3, desc: "3º Período" },
    { id: 4, desc: "4º Período" },
    { id: 5, desc: "5º Período" },
    { id: 6, desc: "6º Período" },
    { id: 7, desc: "7º Período" },
    { id: 8, desc: "8º Período" },
    { id: 9, desc: "9º Período" },
    { id: 10, desc: "10º Período" },
    { id: 15, desc: "11º Período" },
    { id: 16, desc: "12º Período" },
  ]

  const { user, updateUser } = useAuth()
  const { formatDate } = useFormatDate()

  useEffect(() => {
    if (user) {
      const parsedUserId = typeof user.USU_ID === "string" ? Number(user.USU_ID) : user.USU_ID
      const parsedCursoId =
        user.USU_IDCURSO !== undefined && user.USU_IDCURSO !== null
          ? typeof user.USU_IDCURSO === "string"
            ? Number(user.USU_IDCURSO)
            : user.USU_IDCURSO
          : null
      const parsedPeriodoId =
        user.USU_IDPERIODO !== undefined && user.USU_IDPERIODO !== null
          ? typeof user.USU_IDPERIODO === "string"
            ? Number(user.USU_IDPERIODO)
            : user.USU_IDPERIODO
          : null

      setUserId(!Number.isNaN(parsedUserId) ? parsedUserId : null)
      setProfileData(prev => ({
        ...prev,
        name: user.USU_NOME || prev.name,
        email: user.USU_EMAIL || prev.email,
        course: user.USU_CURSO_DESC || prev.course,
        period: user.USU_PERIODO_DESC || prev.period,
        courseId: parsedCursoId,
        periodId: parsedPeriodoId,
      }))
    }
  }, [user])

  useEffect(() => {
    const loadRatings = async () => {
      if (!userId) return
      setRatingLoading(true)
      setRatingError(null)
      try {
        const res = await fetch(`/api/usuarios/avaliacoes?usuarioId=${userId}`)
        const data = await res.json()
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Erro ao carregar avaliações")
        }
        setRatingData({
          media: typeof data.resumo?.media === "number" ? data.resumo.media : null,
          total: typeof data.resumo?.total === "number" ? data.resumo.total : 0,
          avaliacoes: Array.isArray(data.avaliacoes) ? data.avaliacoes : [],
        })
      } catch (err) {
        console.error("Erro ao buscar avaliações do usuário:", err)
        setRatingError("Não foi possível carregar suas avaliações.")
      } finally {
        setRatingLoading(false)
      }
    }

    loadRatings()
  }, [userId])

  const userStats = {
    totalHours: 24,
    helpRequests: 12,
    helpProvided: 8,
    rating: ratingData.media ?? (user && typeof user.USU_AVALIACAO !== "undefined"
      ? typeof user.USU_AVALIACAO === "string"
        ? Number(user.USU_AVALIACAO)
        : Number(user.USU_AVALIACAO)
      : 0),
    totalRatings: ratingData.total,
    level: 3,
    experiencePoints: 750,
    nextLevelPoints: 1000,
  }

  const achievements = [
    {
      id: 1,
      name: "Primeiro Ajudante",
      description: "Prestou sua primeira ajuda",
      icon: Trophy,
      progress: 100,
      unlocked: true,
      unlockedAt: "2023-04-10",
      points: 50,
    },
    {
      id: 2,
      name: "Mentor Dedicado",
      description: "Ajudou 10 pessoas diferentes",
      icon: Users,
      progress: 80,
      unlocked: false,
      points: 100,
    },
    {
      id: 3,
      name: "Especialista em Algoritmos",
      description: "Prestou 5 ajudas em Algoritmos",
      icon: BookOpen,
      progress: 60,
      unlocked: false,
      points: 75,
    },
    {
      id: 4,
      name: "Comunicador",
      description: "Participou de 20 chats",
      icon: MessageCircle,
      progress: 45,
      unlocked: false,
      points: 60,
    },
    {
      id: 5,
      name: "Estrela Cinco",
      description: "Manteve avaliação 5.0 por 1 mês",
      icon: Star,
      progress: 90,
      unlocked: false,
      points: 150,
    },
    {
      id: 6,
      name: "Maratonista",
      description: "Acumulou 50 horas de ajuda",
      icon: Clock,
      progress: 48,
      unlocked: false,
      points: 200,
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "help_provided",
      title: "Ajudou com Árvores Binárias",
      subject: "Algoritmos e Estruturas de Dados",
      date: "2024-01-15",
      rating: 5,
      hours: 2,
    },
    {
      id: 2,
      type: "help_received",
      title: "Recebeu ajuda com Normalização",
      subject: "Banco de Dados",
      date: "2024-01-14",
      rating: 4,
      hours: 1,
    },
    {
      id: 3,
      type: "achievement",
      title: "Conquistou: Primeiro Ajudante",
      date: "2024-01-10",
      points: 50,
    },
    {
      id: 4,
      type: "help_provided",
      title: "Ajudou com Padrões de Projeto",
      subject: "Engenharia de Software",
      date: "2024-01-08",
      rating: 5,
      hours: 1,
    },
  ]

  const specialtiesOptions = [
    "Algoritmos",
    "Estruturas de Dados",
    "Programação",
    "Banco de Dados",
    "Engenharia de Software",
    "Redes de Computadores",
    "Sistemas Operacionais",
    "Matemática",
    "Física",
    "Cálculo",
    "Inteligência Artificial",
    "Machine Learning",
    "Desenvolvimento Web",
    "Desenvolvimento Mobile",
    "Segurança da Informação"
  ]

  const subjectsOptions = [
    "Algoritmos e Estruturas de Dados",
    "Banco de Dados",
    "Engenharia de Software",
    "Programação Orientada a Objetos",
    "Redes de Computadores",
    "Sistemas Operacionais",
    "Cálculo I",
    "Cálculo II",
    "Física I",
    "Matemática Discreta",
    "Inteligência Artificial",
    "Machine Learning",
    "Desenvolvimento Web",
    "Desenvolvimento Mobile",
    "Segurança da Informação"
  ]

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("Erro: ID do usuário não encontrado")
      return
    }

    const trimmedName = profileData.name.trim()
    const payload: Record<string, unknown> = {
      usuarioId: userId,
    }

    if (trimmedName.length >= 2) {
      payload.nome = trimmedName
    }

    if (profileData.courseId !== null && profileData.courseId !== undefined) {
      payload.curso = profileData.courseId
    }

    if (profileData.periodId !== null && profileData.periodId !== undefined) {
      payload.periodo = profileData.periodId
    }

    if (Object.keys(payload).length === 1) {
      alert("Nenhuma alteração para salvar.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Erro ao atualizar perfil")
      }

      if (data.user) {
        updateUser(data.user)
        setProfileData(prev => ({
          ...prev,
          name: data.user.USU_NOME || prev.name,
          course: data.user.USU_CURSO_DESC || prev.course,
          period: data.user.USU_PERIODO_DESC || prev.period,
          courseId: data.user.USU_IDCURSO ?? prev.courseId,
          periodId: data.user.USU_IDPERIODO ?? prev.periodId,
        }))
      }

      setIsEditing(false)
      window.location.reload()
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      alert("Erro ao salvar perfil. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const handleSubjectToggle = (subject: string) => {
    setProfileData(prev => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.includes(subject)
        ? prev.preferredSubjects.filter(s => s !== subject)
        : [...prev.preferredSubjects, subject]
    }))
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "help_provided":
        return <Users className="h-4 w-4 text-primary" />
      case "help_received":
        return <BookOpen className="h-4 w-4 text-secondary" />
      case "achievement":
        return <Trophy className="h-4 w-4 text-chart-5" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }


  return (
    <div className={perfilStyles.container}>
      {/* Background Elements */}
      <div className={perfilStyles.background}>
        <div className={perfilStyles.gradient1}></div>
        <div className={perfilStyles.gradient2}></div>
        <div className={perfilStyles.gradient3}></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className={perfilStyles.main}>
        <div className={perfilStyles.content}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Perfil</h1>
                <p className="text-muted-foreground">Gerencie suas informações e acompanhe seu progresso</p>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? "Cancelar" : "Editar Perfil"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informações do Perfil */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" />
                      <AvatarFallback className="text-2xl">JS</AvatarFallback>
                    </Avatar>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="curso">Curso</Label>
                          <Select 
                            value={profileData.courseId?.toString() || ""} 
                            onValueChange={(value) => {
                              const curso = cursos.find(c => c.id.toString() === value)
                              setProfileData({ 
                                ...profileData, 
                                courseId: curso?.id || null,
                                course: curso?.desc || ""
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o curso" />
                            </SelectTrigger>
                            <SelectContent>
                              {cursos.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.desc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="periodo">Período</Label>
                          <Select 
                            value={profileData.periodId?.toString() || ""} 
                            onValueChange={(value) => {
                              const periodo = periodos.find(p => p.id.toString() === value)
                              setProfileData({ 
                                ...profileData, 
                                periodId: periodo?.id || null,
                                period: periodo?.desc || ""
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                              {periodos.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.desc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            className="min-h-[80px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Especialidades</Label>
                          <div className="flex flex-wrap gap-2">
                            {specialtiesOptions.map((specialty) => (
                              <Button
                                key={specialty}
                                type="button"
                                variant={profileData.specialties.includes(specialty) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSpecialtyToggle(specialty)}
                                className="text-xs"
                              >
                                {specialty}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Matérias Preferidas</Label>
                          <div className="flex flex-wrap gap-2">
                            {subjectsOptions.map((subject) => (
                              <Button
                                key={subject}
                                type="button"
                                variant={profileData.preferredSubjects.includes(subject) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSubjectToggle(subject)}
                                className="text-xs"
                              >
                                {subject}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button onClick={handleSaveProfile} className="w-full" disabled={saving}>
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-xl">{profileData.name}</CardTitle>
                        <CardDescription>{profileData.course}</CardDescription>
                        <CardDescription>{profileData.period}</CardDescription>
                        <p className="text-sm text-muted-foreground mt-2">{profileData.bio}</p>

                        <div className="mt-4 space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Especialidades</h4>
                            <div className="flex flex-wrap gap-1">
                              {profileData.specialties.map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Matérias Preferidas</h4>
                            <div className="flex flex-wrap gap-1">
                              {profileData.preferredSubjects.map((subject) => (
                                <Badge key={subject} variant="outline" className="text-xs">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Nível</span>
                        <Badge variant="secondary">{userStats.level}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Experiência</span>
                          <span>
                            {userStats.experiencePoints}/{userStats.nextLevelPoints} XP
                          </span>
                        </div>
                        <Progress value={(userStats.experiencePoints / userStats.nextLevelPoints) * 100} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{userStats.totalHours}</div>
                          <div className="text-xs text-muted-foreground">Horas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-secondary">{userStats.rating}</div>
                          <div className="text-xs text-muted-foreground">Avaliação</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estatísticas Rápidas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm">Ajudas Solicitadas</span>
                      </div>
                      <span className="font-semibold">{userStats.helpRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-secondary" />
                        <span className="text-sm">Ajudas Prestadas</span>
                      </div>
                      <span className="font-semibold">{userStats.helpProvided}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-chart-5" />
                        <span className="text-sm">Avaliações</span>
                      </div>
                      <span className="font-semibold">{userStats.totalRatings}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conteúdo Principal */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="achievements" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="achievements">Conquistas</TabsTrigger>
                    <TabsTrigger value="activity">Atividade</TabsTrigger>
                    <TabsTrigger value="ratings">Avaliações</TabsTrigger>
                  </TabsList>

                  <TabsContent value="achievements" className="space-y-4">
                    <div className="grid gap-4">
                      {achievements.map((achievement) => {
                        const Icon = achievement.icon
                        return (
                          <Card key={achievement.id} className={achievement.unlocked ? "border-primary" : ""}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`p-3 rounded-lg ${achievement.unlocked ? "bg-primary text-primary-foreground" : "bg-muted"
                                    }`}
                                >
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">{achievement.name}</h3>
                                    <div className="flex items-center gap-2">
                                      {achievement.unlocked && <Badge variant="secondary">Conquistado</Badge>}
                                      <Badge variant="outline">{achievement.points} XP</Badge>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                                  {achievement.unlocked ? (
                                    <p className="text-xs text-muted-foreground">
                                      Conquistado em {formatDate(achievement.unlockedAt!)}
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span>Progresso</span>
                                        <span>{achievement.progress}%</span>
                                      </div>
                                      <Progress value={achievement.progress} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                        <CardDescription>Suas últimas ações na plataforma</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{activity.title}</h4>
                                {activity.subject && <p className="text-xs text-muted-foreground">{activity.subject}</p>}
                                <div className="flex items-center gap-4 mt-2">
                                  <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                                  {activity.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-chart-5" />
                                      <span className="text-xs">{activity.rating}</span>
                                    </div>
                                  )}
                                  {activity.hours && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-primary" />
                                      <span className="text-xs">{activity.hours}h</span>
                                    </div>
                                  )}
                                  {activity.points && (
                                    <Badge variant="outline" className="text-xs">
                                      +{activity.points} XP
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="ratings" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Avaliações Recebidas</CardTitle>
                        <CardDescription>Feedback dos colegas sobre suas ajudas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="text-4xl font-bold text-primary mb-2">
                              {userStats.rating ? userStats.rating.toFixed(1) : "—"}
                            </div>
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${star <= Math.floor(userStats.rating)
                                      ? "text-chart-5 fill-current"
                                      : "text-muted-foreground"
                                    }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {ratingLoading
                                ? "Carregando avaliações..."
                                : userStats.totalRatings > 0
                                  ? `Baseado em ${userStats.totalRatings} avaliação(ões)`
                                  : "Ainda não há avaliações para você"}
                            </p>
                          </div>

                          <div className="space-y-4">
                            {ratingError && (
                              <p className="text-sm text-red-500">{ratingError}</p>
                            )}
                            {ratingData.avaliacoes.map((review, index) => (
                              <div key={`${review.AVA_IDRESPOSTA}-${index}`} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.AVA_ESTRELA ? "text-chart-5 fill-current" : "text-muted-foreground"
                                          }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm mb-2">
                                  {review.RES_DESCRICAO}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{review.AVALIADOR_NOME}</span>
                                  <span>{formatDate(review.RES_DATARESPOSTA)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PerfilPage() {
  return (
    <AuthGuard>
      <PerfilPageContent />
    </AuthGuard>
  )
}

