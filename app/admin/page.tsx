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
import { MateriasManagement } from "@/components/materias-management"
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
  USU_ATIVO: boolean
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
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<Partial<User>>({})
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const [permissoes, setPermissoes] = useState<Array<{PU_IDPERMISSAO: number, PU_NOMEPERMISSAO: string}>>([])

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

      // Buscar permissões
      const permissoesRes = await fetch('/api/periodos') // Vamos criar endpoint específico
      // Por enquanto, vamos usar valores fixos baseados no seed
      setPermissoes([
        { PU_IDPERMISSAO: 1, PU_NOMEPERMISSAO: 'Aluno' },
        { PU_IDPERMISSAO: 2, PU_NOMEPERMISSAO: 'Administrador' },
        { PU_IDPERMISSAO: 3, PU_NOMEPERMISSAO: 'Monitor' }
      ])

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
    setDialogMode("edit")
    setSelectedUser(user)
    setUserForm(user)
    setShowUserDialog(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: typeof selectedUser.USU_ID === 'string' ? parseInt(selectedUser.USU_ID) : selectedUser.USU_ID,
          idPermissao: typeof userForm.USU_IDPERMISSAO === 'string' ? parseInt(userForm.USU_IDPERMISSAO as string) : userForm.USU_IDPERMISSAO
        })
      })

      const data = await response.json()

      if (data.ok) {
        toast({
          title: "Sucesso",
          description: "Permissão do usuário atualizada com sucesso!"
        })
        setShowUserDialog(false)
        fetchData()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar usuário.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar usuário.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/usuarios?id=${userToDelete}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.ok) {
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso!"
        })
        setShowDeleteDialog(false)
        setUserToDelete(null)
        fetchData()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao excluir usuário.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast({
        title: "Erro",
        description: "Falha ao excluir usuário.",
        variant: "destructive"
      })
    }
  }

  if (!currentUser) {
    return <div>Carregando...</div>
  }

  // Verificar se o usuário é administrador (ID 2)
  const isAdmin = currentUser.USU_IDPERMISSAO === 2

  if (!isAdmin) {
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
              <Card>
                <CardHeader>
                  <CardTitle>Acesso Negado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-ajudaqi-text-secondary">
                    Você não tem permissão para acessar esta área. 
                    Apenas administradores podem gerenciar o sistema.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
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
                Painel Administrativo
              </h1>
              <p className="text-ajudaqi-text-secondary">
                Gerenciamento completo da plataforma Ajudaqi
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users">Usuários</TabsTrigger>
                <TabsTrigger value="courses">Cursos</TabsTrigger>
                <TabsTrigger value="materias">Matérias</TabsTrigger>
                <TabsTrigger value="reports">Denúncias</TabsTrigger>
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
                                    variant={user.USU_IDPERMISSAO === 2 ? "default" : "secondary"}
                                    className={user.USU_IDPERMISSAO === 2 ? "bg-ajudaqi-blue" : ""}
                                  >
                                    {user.PU_NOMEPERMISSAO}
                                  </Badge>
                                ) : (
                                  <span className="text-sm">ID {user.USU_IDPERMISSAO}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.USU_ATIVO ? "default" : "secondary"}>
                                  {user.USU_ATIVO ? "Ativo" : "Inativo"}
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

              <TabsContent value="materias" className="space-y-4">
                <MateriasManagement />
              </TabsContent>

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
            </Tabs>

            {/* Modal de Usuário */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {dialogMode === "view" ? "Detalhes do Usuário" : "Editar Permissão do Usuário"}
                  </DialogTitle>
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
                      {dialogMode === "edit" ? (
                        <Select 
                          value={userForm.USU_IDPERMISSAO?.toString()} 
                          onValueChange={(value) => setUserForm({...userForm, USU_IDPERMISSAO: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a permissão" />
                          </SelectTrigger>
                          <SelectContent>
                            {permissoes.map((permissao) => (
                              <SelectItem key={permissao.PU_IDPERMISSAO} value={permissao.PU_IDPERMISSAO.toString()}>
                                {permissao.PU_NOMEPERMISSAO}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge 
                          variant={selectedUser?.USU_IDPERMISSAO === 2 ? "default" : "secondary"}
                          className={selectedUser?.USU_IDPERMISSAO === 2 ? "bg-ajudaqi-blue" : ""}
                        >
                          {selectedUser?.PU_NOMEPERMISSAO || `ID ${selectedUser?.USU_IDPERMISSAO}`}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">
                      Status
                    </Label>
                    <div className="col-span-3">
                      <Badge variant={selectedUser?.USU_ATIVO ? "default" : "secondary"}>
                        {selectedUser?.USU_ATIVO ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  {dialogMode === "edit" ? (
                    <>
                      <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancelar</Button>
                      <Button onClick={handleSaveUser}>Salvar Alterações</Button>
                    </>
                  ) : (
                    <Button onClick={() => setShowUserDialog(false)}>Fechar</Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog de Confirmação de Exclusão */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-ajudaqi-text-secondary">
                    Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={confirmDeleteUser}>
                    Excluir
                  </Button>
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

