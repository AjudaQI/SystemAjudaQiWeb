"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Clock,
  Check,
  CheckCheck,
} from "lucide-react"
import { chatStyles } from "@/app/chat/style"
import { AuthGuard } from "@/components/auth-guard"

interface Message {
  id: number
  content: string
  senderId: string
  senderName: string
  timestamp: string
  status: "sent" | "delivered" | "read"
}

interface Chat {
  id: number
  participantName: string
  participantAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
  subject?: string
  helpRequestId?: number
}

function ChatPageContent() {
  const [activeSection, setActiveSection] = useState("chat")
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const chats: Chat[] = [
    {
      id: 1,
      participantName: "Maria Santos",
      lastMessage: "Obrigada pela ajuda com árvores binárias!",
      lastMessageTime: "14:30",
      unreadCount: 2,
      isOnline: true,
      subject: "Algoritmos e Estruturas de Dados",
      helpRequestId: 1,
    },
    {
      id: 2,
      participantName: "Pedro Lima",
      lastMessage: "Você pode me ajudar com normalização?",
      lastMessageTime: "13:45",
      unreadCount: 0,
      isOnline: false,
      subject: "Banco de Dados",
      helpRequestId: 2,
    },
    {
      id: 3,
      participantName: "Ana Costa",
      lastMessage: "Perfeito! Entendi o padrão Strategy agora",
      lastMessageTime: "12:20",
      unreadCount: 1,
      isOnline: true,
      subject: "Engenharia de Software",
      helpRequestId: 3,
    },
    {
      id: 4,
      participantName: "Carlos Silva",
      lastMessage: "Quando você tem tempo para conversar?",
      lastMessageTime: "11:15",
      unreadCount: 0,
      isOnline: false,
      subject: "Programação Orientada a Objetos",
    },
  ]

  const messages: { [key: number]: Message[] } = {
    1: [
      {
        id: 1,
        content: "Oi João! Vi que você pode me ajudar com árvores binárias",
        senderId: "maria",
        senderName: "Maria Santos",
        timestamp: "14:25",
        status: "read",
      },
      {
        id: 2,
        content: "Claro! Qual é sua dúvida específica?",
        senderId: "joao",
        senderName: "João Silva",
        timestamp: "14:26",
        status: "read",
      },
      {
        id: 3,
        content: "Estou com dificuldade na implementação da busca recursiva",
        senderId: "maria",
        senderName: "Maria Santos",
        timestamp: "14:27",
        status: "read",
      },
      {
        id: 4,
        content: "Vou te explicar passo a passo. A busca em árvore binária funciona assim...",
        senderId: "joao",
        senderName: "João Silva",
        timestamp: "14:28",
        status: "read",
      },
      {
        id: 5,
        content: "Obrigada pela ajuda com árvores binárias!",
        senderId: "maria",
        senderName: "Maria Santos",
        timestamp: "14:30",
        status: "delivered",
      },
    ],
    3: [
      {
        id: 1,
        content: "Oi! Preciso de ajuda com padrões de projeto",
        senderId: "ana",
        senderName: "Ana Costa",
        timestamp: "12:15",
        status: "read",
      },
      {
        id: 2,
        content: "Qual padrão você está estudando?",
        senderId: "joao",
        senderName: "João Silva",
        timestamp: "12:16",
        status: "read",
      },
      {
        id: 3,
        content: "Strategy. Não entendo quando usar",
        senderId: "ana",
        senderName: "Ana Costa",
        timestamp: "12:17",
        status: "read",
      },
      {
        id: 4,
        content: "O Strategy é usado quando você tem diferentes algoritmos para fazer a mesma coisa...",
        senderId: "joao",
        senderName: "João Silva",
        timestamp: "12:18",
        status: "read",
      },
      {
        id: 5,
        content: "Perfeito! Entendi o padrão Strategy agora",
        senderId: "ana",
        senderName: "Ana Costa",
        timestamp: "12:20",
        status: "sent",
      },
    ],
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.subject && chat.subject.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const selectedChatData = chats.find((chat) => chat.id === selectedChat)
  const chatMessages = selectedChat ? messages[selectedChat] || [] : []

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return

    // TODO: Implementar envio de mensagem
    console.log("Enviando mensagem:", newMessage)
    setNewMessage("")
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />
      default:
        return null
    }
  }

  return (
    <div className={chatStyles.container}>
      {/* Background Elements */}
      <div className={chatStyles.background}>
        <div className={chatStyles.gradient1}></div>
        <div className={chatStyles.gradient2}></div>
        <div className={chatStyles.gradient3}></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className={chatStyles.main}>
        <div className={chatStyles.content}>
          {selectedChat ? (
            <div className="flex flex-col h-[calc(100vh-8rem)]">
              {/* Chat Header */}
              <Card className="rounded-b-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedChat(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChatData?.participantAvatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedChatData?.participantName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedChatData?.participantName}</h3>
                      <div className="flex items-center gap-2">
                        {selectedChatData?.isOnline && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-muted-foreground">Online</span>
                          </div>
                        )}
                        {selectedChatData?.subject && (
                          <Badge variant="outline" className="text-xs">
                            {selectedChatData.subject}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Messages Area */}
              <Card className="flex-1 rounded-none border-x">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === "joao" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === "joao" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs opacity-70">{message.timestamp}</span>
                            {message.senderId === "joao" && getMessageStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {/* Message Input */}
              <Card className="rounded-t-none">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Chat</h1>
                  <p className="text-muted-foreground">Converse com outros estudantes em tempo real</p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {chats.reduce((total, chat) => total + chat.unreadCount, 0)} não lidas
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredChats.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma conversa encontrada</h3>
                        <p className="text-muted-foreground">
                          {searchTerm ? "Tente buscar por outro termo" : "Inicie uma conversa ajudando alguém!"}
                        </p>
                      </div>
                    ) : (
                      filteredChats.map((chat, index) => (
                        <div key={chat.id}>
                          <div
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => setSelectedChat(chat.id)}
                          >
                            <div className="relative">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={chat.participantAvatar || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {chat.participantName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {chat.isOnline && (
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium truncate">{chat.participantName}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{chat.lastMessageTime}</span>
                                  {chat.unreadCount > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                                    >
                                      {chat.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                              {chat.subject && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {chat.subject}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {index < filteredChats.length - 1 && <Separator className="my-2" />}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>Inicie uma nova conversa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-16 flex-col gap-2 bg-transparent">
                      <MessageCircle className="h-6 w-6" />
                      Buscar Ajuda
                    </Button>
                    <Button variant="outline" className="h-16 flex-col gap-2 bg-transparent">
                      <Clock className="h-6 w-6" />
                      Conversas Arquivadas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  )
}
