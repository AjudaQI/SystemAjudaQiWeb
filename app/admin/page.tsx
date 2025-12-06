"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Users, BookOpen, Calendar, AlertTriangle, Plus, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CoursesManagement } from "@/components/courses-management"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useAuth, useFormatDate, useStatusColors } from "@/hooks"
import { perfilStyles } from "@/app/perfil/style"
import { AuthGuard } from "@/components/auth-guard"

interface Stats {
  totalUsers: number
  totalMentors: number
  totalAppointments: number
  pendingReports: number
}

interface User {
  USU_ID: number
  USU_MATRICULA: number
  USU_NOME: string
  USU_EMAIL: string
  USU_IDPERMISSAO: number
  USU_IDCURSO?: number
  USU_IDPERIODO?: number
  USU_ATIVO: number
  CUR_DESC?: string
  PER_DESCRICAO?: string
  PU_NOMEPERMISSAO?: string
}

interface Report {
  id: string
  reason: string
  description: string
  status: string
  created_at: string
  reporter: {
    name: string
  }
  reported: {
    name: string
  }
}

function AdminPageContent() {
  const [activeSection, setActiveSection] = useState("admin")
  const { user: currentUser } = useAuth()
  const { formatDate } = useFormatDate()
  const { getStatusColor, getStatusText } = useStatusColors()
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMentors: 0,
    totalAppointments: 0,
    pendingReports: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para gerenciamento de usuários
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<"view">("view")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<Partial<User>>({})

  useEffect(() => {
    if (currentUser) {
      fetchData()
    }
  }, [currentUser])

  const fetchData = async () => {
    if (!currentUser) return
    
    setLoading(true)

    try {
      // Buscar usuários
      const usuariosRes = await fetch('/api/usuarios')
      const usuariosData = await usuariosRes.json()
      
      if (usuariosData.ok) {
        setUsers(usuariosData.usuarios || [])
        setStats(prev => ({
          ...prev,
          totalUsers: usuariosData.total || 0
        }))
      }

      setReports([])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  // Funções para gerenciamento de usuários
  const handleViewUser = (user: User) => {
    setDialogMode("view")
    setSelectedUser(user)
    setUserForm(user)
    setShowUserDialog(true)
  }

  const handleEditUser = (user: User) => {
    toast({
      title: "Em desenvolvimento",
      description: "Função de edição em desenvolvimento.",
    })
  }

  const handleDeleteUser = (userId: number) => {
    toast({
      title: "Em desenvolvimento",
      description: "Função de exclusão em desenvolvimento.",
    })
  }

  if (!currentUser) {
    return <div>Carregando...</div>
  }

  if (loading) {
    return (
      <div className={perfilStyles.container}>
        <div className={perfilStyles.background}>
          <div className={perfilStyles.gradient1}></div>
          <div className={perfilStyles.gradient2}></div>
          <div className={perfilStyles.gradient3}></div>
        </div>
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className={perfilStyles.main}>
          <div className={perfilStyles.content}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
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
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-ajudaqi-text">
                Painel {currentUser.role === "master" ? "Master" : "Administrativo"}
              </h1>
              <p className="text-ajudaqi-text-secondary">
                {currentUser.role === "master" ? "Controle total da plataforma Ajudaqi" : "Gerenciamento do seu curso"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-ajudaqi-text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mentores Ativos</CardTitle>
                  <BookOpen className="h-4 w-4 text-ajudaqi-text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-ajudaqi-text-secondary italic">Em desenvolvimento</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                  <Calendar className="h-4 w-4 text-ajudaqi-text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-ajudaqi-text-secondary italic">Em desenvolvimento</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Denúncias Pendentes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-ajudaqi-error" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-ajudaqi-text-secondary italic">Em desenvolvimento</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className={`grid w-full ${currentUser.role === "master" ? "grid-cols-3" : "grid-cols-2"}`}>
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="courses">Cursos & Matérias</TabsTrigger>
                {currentUser.role === "master" && (
                  <TabsTrigger value="reports">
                    Denúncias
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Gerenciar Usuários ({users.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-ajudaqi-text-secondary">
                        <Users className="mx-auto h-12 w-12 mb-4" />
                        <p>Nenhum usuário encontrado</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Matrícula</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Curso</TableHead>
                            <TableHead>Permissão</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.USU_ID}>
                              <TableCell>
                                <span className="font-mono text-sm">{user.USU_MATRICULA}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-ajudaqi-blue text-white text-xs">
                                      {user.USU_NOME
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium">{user.USU_NOME}</div>
                                </div>
                              </TableCell>
                              <TableCell>{user.USU_EMAIL}</TableCell>
                              <TableCell>
                                {user.CUR_DESC ? (
                                  <div>
                                    <div className="text-sm">{user.CUR_DESC}</div>
                                    {user.PER_DESCRICAO && (
                                      <div className="text-xs text-ajudaqi-text-secondary">{user.PER_DESCRICAO}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-ajudaqi-text-secondary italic">Não informado</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {user.PU_NOMEPERMISSAO ? (
                                  <Badge 
                                    variant={user.USU_IDPERMISSAO === 4 ? "default" : "secondary"}
                                    className={user.USU_IDPERMISSAO === 4 ? "bg-ajudaqi-blue" : ""}
                                  >
                                    {user.PU_NOMEPERMISSAO}
                                  </Badge>
                                ) : (
                                  <span className="text-sm">ID {user.USU_IDPERMISSAO}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.USU_ATIVO === 1 ? "default" : "secondary"}>
                                  {user.USU_ATIVO === 1 ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-ajudaqi-error hover:text-ajudaqi-error"
                                    onClick={() => handleDeleteUser(user.USU_ID)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                <CoursesManagement currentUser={currentUser} />
              </TabsContent>

              {currentUser.role === "master" && (
                <TabsContent value="reports" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-ajudaqi-error" />
                        <span>Moderação de Denúncias</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reports.length === 0 ? (
                        <div className="text-center py-8 text-ajudaqi-text-secondary">
                          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                          <p>Nenhuma denúncia encontrada</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Denunciante</TableHead>
                              <TableHead>Denunciado</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reports.map((report) => (
                              <TableRow key={report.id} className="border-l-4 border-l-ajudaqi-error">
                                <TableCell>{report.reporter.name}</TableCell>
                                <TableCell>{report.reported.name}</TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{report.reason}</div>
                                    <div className="text-sm text-ajudaqi-text-secondary truncate max-w-xs">
                                      {report.description}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(report.status)}>{getStatusText(report.status)}</Badge>
                                </TableCell>
                                <TableCell>{formatDate(report.created_at)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    {report.status === "pending" && (
                                      <>
                                        <Button variant="outline" size="sm" className="text-ajudaqi-success">
                                          Resolver
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-ajudaqi-text-secondary">
                                          Descartar
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            {/* Modal de Usuário */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Detalhes do Usuário</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Matrícula
                    </Label>
                    <div className="col-span-3">
                      <span className="font-mono">{selectedUser?.USU_MATRICULA}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Nome
                    </Label>
                    <div className="col-span-3">
                      {selectedUser?.USU_NOME}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Email
                    </Label>
                    <div className="col-span-3">
                      {selectedUser?.USU_EMAIL}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Curso
                    </Label>
                    <div className="col-span-3">
                      {selectedUser?.CUR_DESC || <span className="text-ajudaqi-text-secondary italic">Não informado</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Período
                    </Label>
                    <div className="col-span-3">
                      {selectedUser?.PER_DESCRICAO || <span className="text-ajudaqi-text-secondary italic">Não informado</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Permissão
                    </Label>
                    <div className="col-span-3">
                      <Badge 
                        variant={selectedUser?.USU_IDPERMISSAO === 4 ? "default" : "secondary"}
                        className={selectedUser?.USU_IDPERMISSAO === 4 ? "bg-ajudaqi-blue" : ""}
                      >
                        {selectedUser?.PU_NOMEPERMISSAO || `ID ${selectedUser?.USU_IDPERMISSAO}`}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Status
                    </Label>
                    <div className="col-span-3">
                      <Badge variant={selectedUser?.USU_ATIVO === 1 ? "default" : "secondary"}>
                        {selectedUser?.USU_ATIVO === 1 ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={() => setShowUserDialog(false)}>Fechar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPageContent />
    </AuthGuard>
  )
}

