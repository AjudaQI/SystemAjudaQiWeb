"use client"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, MessageCircle, User, UserPlus, Home, HelpCircle, Star, LogOut, Lock, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks"

// TODO: Remover estas flags quando as funcionalidades estiverem prontas
const ENABLE_CHAT = false
const ENABLE_PROFILE = false
const ENABLE_FRIENDS = false
const ENABLE_AVAILABLE_HELPERS = false

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  
  const userName = user?.USU_NOME || "Usuário"
  const userCourse = user?.USU_CURSO_DESC || ""
  const userPeriod = user?.USU_PERIODO_DESC || ""

  // Buscar avaliação média do usuário baseada nas respostas avaliadas
  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user?.USU_ID) return
      
      try {
        const usuarioId = typeof user.USU_ID === 'string' ? parseInt(user.USU_ID) : user.USU_ID
        const response = await fetch(`/api/usuarios/avaliacoes?usuarioId=${usuarioId}`)
        const data = await response.json()
        
        if (data.ok && data.resumo?.media !== null && data.resumo?.media !== undefined) {
          setUserRating(data.resumo.media)
        } else {
          setUserRating(null)
        }
      } catch (error) {
        console.error('Erro ao buscar avaliação do usuário:', error)
        setUserRating(null)
      }
    }

    fetchUserRating()

    // Listener para atualizar avaliação quando uma resposta for avaliada
    const handleResponseRated = () => {
      fetchUserRating()
    }

    window.addEventListener('responseRated', handleResponseRated)

    return () => {
      window.removeEventListener('responseRated', handleResponseRated)
    }
  }, [user?.USU_ID])
  
  // Mapeia rotas para IDs de seção
  const routeToSectionMap: Record<string, string> = {
    "/dashboard": "dashboard",
    "/solicitacoes": "help-requests",
    "/disponiveis": "available-helpers",
    "/chat": "chat",
    "/perfil": "profile",
    "/amigos": "friends",
    "/admin": "admin",
  }
  
  // Determina a seção ativa baseada na rota atual ou activeSection
  const currentActiveSection = routeToSectionMap[pathname] || activeSection

  // Verifica se o usuário tem permissão de administrador (USU_IDPERMISSAO = 4)
  const isAdmin = user?.USU_IDPERMISSAO === 4 || user?.USU_IDPERMISSAO === "4"

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, route: "/dashboard" },
    { id: "help-requests", label: "Solicitações de Ajuda", icon: HelpCircle, route: "/solicitacoes" },
    { id: "available-helpers", label: "Disponíveis para Ajudar", icon: Users, route: "/disponiveis" },
    { id: "chat", label: "Chat", icon: MessageCircle, badge: "3", route: "/chat" },
    { id: "profile", label: "Perfil", icon: User, route: "/perfil" },
    { id: "friends", label: "Amigos", icon: UserPlus, route: "/amigos" },
  ]

  // Adiciona o item de administração apenas se o usuário for admin
  if (isAdmin) {
    menuItems.push({ id: "admin", label: "Painel da administração", icon: Shield, route: "/admin" })
  }

  const userInfo = {
    name: userName,
    course: userCourse || "Curso não informado",
    period: userPeriod || "Período não informado",
    rating: userRating,
  }

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleLogout = () => {
    // Remover dados do usuário do localStorage
    localStorage.removeItem('ajudaqi_user')
    // Redirecionar para a página de login
    router.push('/')
  }

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-primary">Ajudaqi</h1>
            <p className="text-sm text-muted-foreground">Plataforma de Ajuda Universitária</p>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/student-avatar.png" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{userInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{userInfo.course}</p>
                <p className="text-xs text-muted-foreground">{userInfo.period}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {userInfo.rating !== null && typeof userInfo.rating === "number" ? userInfo.rating.toFixed(1) : "—"}
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                // Determina se o item está ativo baseado na rota atual ou seção ativa
                const isActive = pathname === item.route || (pathname === "/dashboard" && currentActiveSection === item.id)
                
                // Verifica se o item está desabilitado
                const isDisabled = 
                  (item.id === "chat" && !ENABLE_CHAT) ||
                  (item.id === "profile" && !ENABLE_PROFILE) ||
                  (item.id === "friends" && !ENABLE_FRIENDS) ||
                  (item.id === "available-helpers" && !ENABLE_AVAILABLE_HELPERS)
                
                return (
                  <li key={item.id}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-12",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return
                        setIsOpen(false)
                        // Se estiver no dashboard e o item clicado for dashboard, usa onSectionChange
                        if (pathname === "/dashboard" && item.id === "dashboard" && onSectionChange && typeof onSectionChange === 'function') {
                          onSectionChange(item.id)
                        } else {
                          // Para todos os outros casos, redireciona para a rota correspondente
                          router.push(item.route)
                        }
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isDisabled && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {item.badge && !isDisabled && (
                        <Badge variant="destructive" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
