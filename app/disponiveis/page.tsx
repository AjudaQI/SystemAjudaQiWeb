"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Search, Filter, Star, Clock, BookOpen, Users, MapPin, Plus, Check } from "lucide-react"
import { disponiveisStyles } from "@/app/disponiveis/style"
import { AuthGuard } from "@/components/auth-guard"

interface AvailableHelper {
  id: number
  name: string
  email: string
  course: string
  period: string
  bio: string
  rating: number
  totalRatings: number
  totalHours: number
  helpProvided: number
  specialties: string[]
  isOnline: boolean
  lastSeen: string
  availableForChat: boolean
  preferredSubjects: string[]
  avatar?: string
  university: string
  joinDate: string
  level: number
  experiencePoints: number
}

function DisponiveisPageContent() {
  const [activeSection, setActiveSection] = useState("available-helpers")
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isUserAvailable, setIsUserAvailable] = useState(false)

  const helpers: AvailableHelper[] = [
    {
      id: 1,
      name: "Maria Santos",
      email: "maria.santos@universidade.edu",
      course: "Engenharia de Software",
      period: "8º Período",
      bio: "Especialista em algoritmos e estruturas de dados. Sempre disposta a ajudar colegas com programação e matemática.",
      rating: 4.8,
      totalRatings: 24,
      totalHours: 45,
      helpProvided: 18,
      specialties: ["Algoritmos", "Estruturas de Dados", "Programação Competitiva"],
      isOnline: true,
      lastSeen: "Agora",
      availableForChat: true,
      preferredSubjects: ["Algoritmos e Estruturas de Dados", "Matemática Discreta"],
      university: "Universidade Federal de Tecnologia",
      joinDate: "2023-01-15",
      level: 5,
      experiencePoints: 1200,
    },
    {
      id: 2,
      name: "Pedro Lima",
      email: "pedro.lima@universidade.edu",
      course: "Engenharia de Software",
      period: "7º Período",
      bio: "Focado em banco de dados e sistemas distribuídos. Experiência com SQL, NoSQL e arquiteturas de software.",
      rating: 4.6,
      totalRatings: 19,
      totalHours: 32,
      helpProvided: 14,
      specialties: ["Banco de Dados", "SQL", "Sistemas Distribuídos"],
      isOnline: false,
      lastSeen: "2 horas atrás",
      availableForChat: true,
      preferredSubjects: ["Banco de Dados", "Engenharia de Software"],
      university: "Universidade Federal de Tecnologia",
      joinDate: "2023-02-20",
      level: 4,
      experiencePoints: 950,
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana.costa@universidade.edu",
      course: "Engenharia de Software",
      period: "6º Período",
      bio: "Apaixonada por padrões de projeto e arquitetura de software. Sempre pronta para compartilhar conhecimento.",
      rating: 4.9,
      totalRatings: 31,
      totalHours: 38,
      helpProvided: 22,
      specialties: ["Padrões de Projeto", "Arquitetura de Software", "Clean Code"],
      isOnline: true,
      lastSeen: "Agora",
      availableForChat: true,
      preferredSubjects: ["Engenharia de Software", "Programação Orientada a Objetos"],
      university: "Universidade Federal de Tecnologia",
      joinDate: "2023-03-10",
      level: 5,
      experiencePoints: 1100,
    },
    {
      id: 4,
      name: "Carlos Silva",
      email: "carlos.silva@universidade.edu",
      course: "Engenharia de Software",
      period: "9º Período",
      bio: "Especialista em redes de computadores e segurança. Experiência com protocolos de rede e criptografia.",
      rating: 4.7,
      totalRatings: 16,
      totalHours: 28,
      helpProvided: 12,
      specialties: ["Redes de Computadores", "Segurança", "Protocolos de Rede"],
      isOnline: false,
      lastSeen: "1 dia atrás",
      availableForChat: false,
      preferredSubjects: ["Redes de Computadores", "Sistemas Operacionais"],
      university: "Universidade Federal de Tecnologia",
      joinDate: "2022-11-05",
      level: 4,
      experiencePoints: 800,
    },
    {
      id: 5,
      name: "Lucas Oliveira",
      email: "lucas.oliveira@universidade.edu",
      course: "Engenharia de Software",
      period: "5º Período",
      bio: "Focado em desenvolvimento web e mobile. Conhecimento em React, Node.js e desenvolvimento de aplicações.",
      rating: 4.5,
      totalRatings: 12,
      totalHours: 20,
      helpProvided: 8,
      specialties: ["Desenvolvimento Web", "React", "Node.js"],
      isOnline: true,
      lastSeen: "Agora",
      availableForChat: true,
      preferredSubjects: ["Programação Orientada a Objetos", "Engenharia de Software"],
      university: "Universidade Federal de Tecnologia",
      joinDate: "2023-04-15",
      level: 3,
      experiencePoints: 600,
    },
    {
      id: 6,
      name: "Fernanda Rocha",
      email: "fernanda.rocha@universidade.edu",
      course: "Engenharia de Software",
      period: "6º Período",
      bio: "Especialista em matemática e cálculo. Ajuda colegas com disciplinas de exatas e programação.",
      rating: 4.8,
      totalRatings: 20,
      totalHours: 35,
      helpProvided: 16,
      specialties: ["Cálculo", "Matemática Discreta", "Álgebra Linear"],
      isOnline: false,
      lastSeen: "3 horas atrás",
      availableForChat: true,
      preferredSubjects: ["Cálculo I", "Cálculo II", "Matemática Discreta"],
      university: "Universidade Federal de Tecnologia",
      joinDate: "2023-01-25",
      level: 4,
      experiencePoints: 900,
    },
  ]

  const subjects = [
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
  ]

  const periods = [
    { value: "1", label: "1º Período" },
    { value: "2", label: "2º Período" },
    { value: "3", label: "3º Período" },
    { value: "4", label: "4º Período" },
    { value: "5", label: "5º Período" },
    { value: "6", label: "6º Período" },
    { value: "7", label: "7º Período" },
    { value: "8", label: "8º Período" },
    { value: "9", label: "9º Período" },
    { value: "10", label: "10º Período" },
  ]

  // Adicionar o usuário atual à lista se estiver disponível
  const currentUser: AvailableHelper = {
    id: 999,
    name: "João Silva (Você)",
    email: "joao.silva@universidade.edu",
    course: "Engenharia de Software",
    period: "6º Período",
    bio: "Estudante apaixonado por tecnologia, sempre disposto a ajudar colegas e aprender coisas novas.",
    rating: 4.8,
    totalRatings: 15,
    totalHours: 24,
    helpProvided: 8,
    specialties: ["Algoritmos", "Estruturas de Dados", "Programação"],
    isOnline: true,
    lastSeen: "Agora",
    availableForChat: true,
    preferredSubjects: ["Algoritmos e Estruturas de Dados", "Engenharia de Software"],
    university: "Universidade Federal de Tecnologia",
    joinDate: "2023-03-15",
    level: 3,
    experiencePoints: 750,
  }

  const allHelpers = isUserAvailable ? [currentUser, ...helpers] : helpers

  const filteredHelpers = allHelpers.filter((helper) => {
    const matchesSearch = helper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         helper.specialties.some(specialty => 
                           specialty.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesSubject = subjectFilter === "all" || 
                          helper.preferredSubjects.includes(subjectFilter)
    
    const matchesPeriod = periodFilter === "all" || 
                         helper.period.includes(periodFilter)
    
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "online" && helper.isOnline) ||
                         (statusFilter === "offline" && !helper.isOnline)

    return matchesSearch && matchesSubject && matchesPeriod && matchesStatus
  })

  const handleContactHelper = (helper: AvailableHelper) => {
    console.log("Contatando:", helper.name)
    // TODO: Implementar lógica de contato
  }

  const handleViewProfile = (helper: AvailableHelper) => {
    console.log("Visualizando perfil:", helper.name)
    // TODO: Implementar visualização de perfil
  }

  const handleToggleAvailability = () => {
    setIsUserAvailable(!isUserAvailable)
    // TODO: Implementar lógica para salvar status de disponibilidade
    console.log("Status de disponibilidade:", !isUserAvailable ? "Disponível" : "Indisponível")
  }

  return (
    <div className={disponiveisStyles.container}>
      {/* Background Elements */}
      <div className={disponiveisStyles.background}>
        <div className={disponiveisStyles.gradient1}></div>
        <div className={disponiveisStyles.gradient2}></div>
        <div className={disponiveisStyles.gradient3}></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className={disponiveisStyles.main}>
        <div className={disponiveisStyles.content}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Disponíveis para Ajudar</h1>
                <p className="text-muted-foreground">
                  Encontre colegas que podem te ajudar com suas dúvidas acadêmicas
                </p>
              </div>
              <Button
                onClick={handleToggleAvailability}
                variant={isUserAvailable ? "default" : "outline"}
                className="flex items-center gap-2"
              >
                {isUserAvailable ? (
                  <>
                    <Check className="h-4 w-4" />
                    Disponível para Ajudar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Me Disponibilizar
                  </>
                )}
              </Button>
            </div>

            {/* Filters */}
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
                        placeholder="Nome ou especialidade..."
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
                        <SelectValue placeholder="Todas as matérias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as matérias</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período</label>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os períodos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        {periods.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredHelpers.length} colega{filteredHelpers.length !== 1 ? 's' : ''} encontrado{filteredHelpers.length !== 1 ? 's' : ''}
                </p>
              </div>

              {filteredHelpers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum colega encontrado</h3>
                    <p className="text-muted-foreground text-center">
                      Tente ajustar os filtros para encontrar mais pessoas disponíveis para ajudar.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHelpers.map((helper) => (
                    <Card key={helper.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={helper.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-lg">
                                {helper.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${
                              helper.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">{helper.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                Nível {helper.level}
                              </Badge>
                              {helper.id === 999 && (
                                <Badge variant="default" className="text-xs bg-primary">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {helper.course} • {helper.period}
                            </p>
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{helper.rating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({helper.totalRatings} avaliações)
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {helper.totalHours}h
                              </div>
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {helper.helpProvided} ajudas
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {helper.lastSeen}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {helper.bio}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Especialidades</h4>
                          <div className="flex flex-wrap gap-1">
                            {helper.specialties.slice(0, 3).map((specialty) => (
                              <Badge key={specialty} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {helper.specialties.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{helper.specialties.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Matérias Preferidas</h4>
                          <div className="flex flex-wrap gap-1">
                            {helper.preferredSubjects.slice(0, 2).map((subject) => (
                              <Badge key={subject} variant="secondary" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                            {helper.preferredSubjects.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{helper.preferredSubjects.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {helper.id === 999 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={handleToggleAvailability}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Parar de Ajudar
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleContactHelper(helper)}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Contatar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewProfile(helper)}
                              >
                                Ver Perfil
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DisponiveisPage() {
  return (
    <AuthGuard>
      <DisponiveisPageContent />
    </AuthGuard>
  )
}
