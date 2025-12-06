"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus, Search, MessageCircle, Star, Clock, Users, Check, X, Send } from "lucide-react"
import { useFormatDate } from "@/hooks"
import { amigosStyles } from "@/app/amigos/style"
import { AuthGuard } from "@/components/auth-guard"

interface User {
  id: number
  name: string
  avatar?: string
  course: string
  period: string
  rating: number
  totalHours: number
  specialties: string[]
  isOnline: boolean
  isFriend: boolean
  friendshipStatus?: "pending" | "requested" | "friends"
  mutualFriends?: number
}

interface FriendRequest {
  id: number
  user: User
  message: string
  createdAt: string
}

function AmigosPageContent() {
  const [activeSection, setActiveSection] = useState("friends")
  const [selectedTab, setSelectedTab] = useState("friends")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [reviewText, setReviewText] = useState("")
  const [reviewRating, setReviewRating] = useState(5)

  const friends: User[] = [
    {
      id: 1,
      name: "Maria Santos",
      course: "Engenharia de Software",
      period: "4º Período",
      rating: 4.8,
      totalHours: 32,
      specialties: ["Algoritmos", "Estruturas de Dados"],
      isOnline: true,
      isFriend: true,
      friendshipStatus: "friends",
    },
    {
      id: 2,
      name: "Pedro Lima",
      course: "Engenharia de Software",
      period: "5º Período",
      rating: 4.6,
      totalHours: 28,
      specialties: ["Banco de Dados", "SQL"],
      isOnline: false,
      isFriend: true,
      friendshipStatus: "friends",
    },
    {
      id: 3,
      name: "Ana Costa",
      course: "Engenharia de Software",
      period: "6º Período",
      rating: 4.9,
      totalHours: 45,
      specialties: ["Padrões de Projeto", "Arquitetura"],
      isOnline: true,
      isFriend: true,
      friendshipStatus: "friends",
    },
  ]

  const suggestedUsers: User[] = [
    {
      id: 4,
      name: "Carlos Silva",
      course: "Engenharia de Software",
      period: "3º Período",
      rating: 4.2,
      totalHours: 18,
      specialties: ["POO", "Java"],
      isOnline: true,
      isFriend: false,
      mutualFriends: 2,
    },
    {
      id: 5,
      name: "Julia Oliveira",
      course: "Engenharia de Software",
      period: "7º Período",
      rating: 4.7,
      totalHours: 52,
      specialties: ["Redes", "Sistemas Distribuídos"],
      isOnline: false,
      isFriend: false,
      mutualFriends: 1,
    },
    {
      id: 6,
      name: "Rafael Santos",
      course: "Engenharia de Software",
      period: "5º Período",
      rating: 4.4,
      totalHours: 35,
      specialties: ["Mobile", "React Native"],
      isOnline: true,
      isFriend: false,
      mutualFriends: 3,
    },
  ]

  const friendRequests: FriendRequest[] = [
    {
      id: 1,
      user: {
        id: 7,
        name: "Lucas Ferreira",
        course: "Engenharia de Software",
        period: "4º Período",
        rating: 4.3,
        totalHours: 22,
        specialties: ["Frontend", "React"],
        isOnline: true,
        isFriend: false,
        friendshipStatus: "pending",
      },
      message: "Oi! Vi que você é especialista em algoritmos. Gostaria de trocar conhecimentos!",
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      user: {
        id: 8,
        name: "Beatriz Costa",
        course: "Engenharia de Software",
        period: "6º Período",
        rating: 4.6,
        totalHours: 38,
        specialties: ["UX/UI", "Design"],
        isOnline: false,
        isFriend: false,
        friendshipStatus: "pending",
      },
      message: "Olá! Somos do mesmo período e curso. Vamos nos conectar?",
      createdAt: "2024-01-14T15:45:00Z",
    },
  ]

  const filteredFriends = friends.filter((friend) => friend.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredSuggestions = suggestedUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendFriendRequest = (userId: number) => {
    console.log("Enviando solicitação de amizade para:", userId)
    // TODO: Implementar envio de solicitação
  }

  const handleAcceptFriendRequest = (requestId: number) => {
    console.log("Aceitando solicitação:", requestId)
    // TODO: Implementar aceitação de solicitação
  }

  const handleRejectFriendRequest = (requestId: number) => {
    console.log("Rejeitando solicitação:", requestId)
    // TODO: Implementar rejeição de solicitação
  }

  const handleSubmitReview = () => {
    if (!selectedUser || !reviewText.trim()) return
    console.log("Enviando avaliação:", { user: selectedUser.id, rating: reviewRating, text: reviewText })
    setReviewText("")
    setReviewRating(5)
    setSelectedUser(null)
    // TODO: Implementar envio de avaliação
  }

  const { formatDateTime } = useFormatDate()

  return (
    <div className={amigosStyles.container}>
      {/* Background Elements */}
      <div className={amigosStyles.background}>
        <div className={amigosStyles.gradient1}></div>
        <div className={amigosStyles.gradient2}></div>
        <div className={amigosStyles.gradient3}></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className={amigosStyles.main}>
        <div className={amigosStyles.content}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Amigos</h1>
                <p className="text-muted-foreground">Conecte-se com outros estudantes e construa sua rede de aprendizado</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {friends.length} amigos
                </Badge>
                {friendRequests.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <UserPlus className="h-3 w-3" />
                    {friendRequests.length} solicitações
                  </Badge>
                )}
              </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="friends">Meus Amigos</TabsTrigger>
                <TabsTrigger value="requests">
                  Solicitações
                  {friendRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {friendRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
                <TabsTrigger value="search">Buscar</TabsTrigger>
              </TabsList>

              <TabsContent value="friends" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <CardTitle>Meus Amigos ({friends.length})</CardTitle>
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar amigos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {filteredFriends.map((friend) => (
                        <Card key={friend.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={friend.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {friend.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                {friend.isOnline && (
                                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{friend.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {friend.course} • {friend.period}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs">{friend.rating}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-primary" />
                                    <span className="text-xs">{friend.totalHours}h</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {friend.specialties.map((specialty) => (
                                    <Badge key={specialty} variant="outline" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Chat
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedUser(friend)}
                                      className="bg-transparent"
                                    >
                                      <Star className="h-3 w-3 mr-1" />
                                      Avaliar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Avaliar {friend.name}</DialogTitle>
                                      <DialogDescription>
                                        Compartilhe sua experiência trabalhando com este colega
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Avaliação</label>
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} onClick={() => setReviewRating(star)} className="p-1">
                                              <Star
                                                className={`h-6 w-6 ${
                                                  star <= reviewRating
                                                    ? "text-yellow-500 fill-current"
                                                    : "text-muted-foreground"
                                                }`}
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Comentário</label>
                                        <Textarea
                                          placeholder="Descreva sua experiência..."
                                          value={reviewText}
                                          onChange={(e) => setReviewText(e.target.value)}
                                          className="min-h-[100px]"
                                        />
                                      </div>
                                      <Button onClick={handleSubmitReview} className="w-full">
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar Avaliação
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Solicitações de Amizade</CardTitle>
                    <CardDescription>Pessoas que querem se conectar com você</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {friendRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação pendente</h3>
                        <p className="text-muted-foreground">Quando alguém quiser se conectar com você, aparecerá aqui.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {friendRequests.map((request) => (
                          <Card key={request.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={request.user.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {request.user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">{request.user.name}</h3>
                                    <span className="text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {request.user.course} • {request.user.period}
                                  </p>
                                  <p className="text-sm mb-3">{request.message}</p>
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                      <span className="text-xs">{request.user.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-primary" />
                                      <span className="text-xs">{request.user.totalHours}h</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {request.user.specialties.map((specialty) => (
                                      <Badge key={specialty} variant="outline" className="text-xs">
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleAcceptFriendRequest(request.id)}>
                                      <Check className="h-3 w-3 mr-1" />
                                      Aceitar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRejectFriendRequest(request.id)}
                                      className="bg-transparent"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Recusar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sugestões de Amizade</CardTitle>
                    <CardDescription>Pessoas que você pode conhecer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {suggestedUsers.map((user) => (
                        <Card key={user.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold">{user.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {user.course} • {user.period}
                                </p>
                                {user.mutualFriends && (
                                  <p className="text-xs text-muted-foreground">
                                    {user.mutualFriends} amigo{user.mutualFriends > 1 ? "s" : ""} em comum
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs">{user.rating}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-primary" />
                                    <span className="text-xs">{user.totalHours}h</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {user.specialties.map((specialty) => (
                                    <Badge key={specialty} variant="outline" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button size="sm" onClick={() => handleSendFriendRequest(user.id)}>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="search" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Buscar Usuários</CardTitle>
                    <CardDescription>Encontre outros estudantes para se conectar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, curso ou especialidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {searchTerm ? (
                      <div className="grid gap-4">
                        {filteredSuggestions.map((user) => (
                          <Card key={user.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{user.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {user.course} • {user.period}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                      <span className="text-xs">{user.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-primary" />
                                      <span className="text-xs">{user.totalHours}h</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {user.specialties.map((specialty) => (
                                      <Badge key={specialty} variant="outline" className="text-xs">
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Button size="sm" onClick={() => handleSendFriendRequest(user.id)}>
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Adicionar
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Digite para buscar</h3>
                        <p className="text-muted-foreground">Use a barra de busca acima para encontrar outros estudantes</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AmigosPage() {
  return (
    <AuthGuard>
      <AmigosPageContent />
    </AuthGuard>
  )
}
