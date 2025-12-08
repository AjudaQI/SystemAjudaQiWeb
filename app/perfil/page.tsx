"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { User, Mail, GraduationCap, Calendar, Shield, Edit, Lock, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks"
import { perfilStyles } from "@/app/perfil/style"
import { AuthGuard } from "@/components/auth-guard"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function PerfilPageContent() {
  const [activeSection, setActiveSection] = useState("profile")
  const { user, updateUser } = useAuth()
  
  // Estados para edição de nome
  const [showEditNameDialog, setShowEditNameDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [savingName, setSavingName] = useState(false)
  
  // Estados para edição de curso/período
  const [showEditCursoDialog, setShowEditCursoDialog] = useState(false)
  const [selectedCurso, setSelectedCurso] = useState<string>("")
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("")
  const [savingCurso, setSavingCurso] = useState(false)
  const [cursos, setCursos] = useState<any[]>([])
  const [periodos, setPeriodos] = useState<any[]>([])
  
  // Estados para troca de senha
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [savingPassword, setSavingPassword] = useState(false)

  // Carregar cursos e períodos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cursosRes, periodosRes] = await Promise.all([
          fetch('/api/cursos'),
          fetch('/api/periodos')
        ])
        const cursosData = await cursosRes.json()
        const periodosData = await periodosRes.json()
        
        if (cursosData.ok) setCursos(cursosData.cursos)
        if (periodosData.ok) setPeriodos(periodosData.periodos)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      }
    }
    loadData()
  }, [])

  const handleOpenEditName = () => {
    setNewName(user?.USU_NOME || "")
    setShowEditNameDialog(true)
  }

  const handleOpenEditCurso = () => {
    setSelectedCurso(user?.USU_IDCURSO?.toString() || "")
    setSelectedPeriodo(user?.USU_IDPERIODO?.toString() || "")
    setShowEditCursoDialog(true)
  }

  const handleSaveCurso = async () => {
    if (!selectedCurso || !selectedPeriodo) {
      toast({
        title: "Erro",
        description: "Selecione curso e período.",
        variant: "destructive"
      })
      return
    }

    setSavingCurso(true)
    try {
      const response = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: typeof user?.USU_ID === 'string' ? parseInt(user.USU_ID) : user?.USU_ID,
          curso: parseInt(selectedCurso),
          periodo: parseInt(selectedPeriodo)
        })
      })

      const data = await response.json()

      if (data.ok && data.user) {
        updateUser(data.user)
        toast({
          title: "Sucesso",
          description: "Curso e período atualizados com sucesso!"
        })
        setShowEditCursoDialog(false)
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar curso/período.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar curso/período:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar curso/período.",
        variant: "destructive"
      })
    } finally {
      setSavingCurso(false)
    }
  }

  const handleSaveName = async () => {
    if (!newName.trim() || newName.length < 2) {
      toast({
        title: "Erro",
        description: "Nome deve ter no mínimo 2 caracteres.",
        variant: "destructive"
      })
      return
    }

    setSavingName(true)
    try {
      const response = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: typeof user?.USU_ID === 'string' ? parseInt(user.USU_ID) : user?.USU_ID,
          nome: newName.trim()
        })
      })

      const data = await response.json()

      if (data.ok) {
        // Atualizar dados do usuário no localStorage
        const updatedUser = { ...user, USU_NOME: newName.trim() }
        updateUser(updatedUser)
        
        toast({
          title: "Sucesso",
          description: "Nome atualizado com sucesso!"
        })
        setShowEditNameDialog(false)
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao atualizar nome.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar nome:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar nome.",
        variant: "destructive"
      })
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter no mínimo 6 caracteres.",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      })
      return
    }

    setSavingPassword(true)
    try {
      const response = await fetch('/api/usuarios/senha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: typeof user?.USU_ID === 'string' ? parseInt(user.USU_ID) : user?.USU_ID,
          senhaAtual: currentPassword,
          senhaNova: newPassword
        })
      })

      const data = await response.json()

      console.log('[PERFIL] Resposta da API de senha:', data)

      if (data.ok) {
        toast({
          title: "Sucesso",
          description: "Senha alterada com sucesso!"
        })
        setShowChangePasswordDialog(false)
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao alterar senha.",
          variant: "destructive"
        })
        console.error('[PERFIL] Erro ao alterar senha:', data)
      }
    } catch (error) {
      console.error("[PERFIL] Erro ao alterar senha:", error)
      toast({
        title: "Erro",
        description: "Falha ao alterar senha.",
        variant: "destructive"
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getPermissaoLabel = (idPermissao?: number | string) => {
    const id = typeof idPermissao === 'string' ? parseInt(idPermissao) : idPermissao
    switch (id) {
      case 1: return "Aluno"
      case 2: return "Administrador"
      case 3: return "Monitor"
      default: return "Não definido"
    }
  }

  if (!user) {
    return <div>Carregando...</div>
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
            <div>
              <h1 className="text-3xl font-bold">Perfil</h1>
              <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {getInitials(user.USU_NOME || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{user.USU_NOME}</CardTitle>
                    <CardDescription className="text-base">{getPermissaoLabel(user.USU_IDPERMISSAO)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações do Usuário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="font-medium">{user.USU_EMAIL}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Matrícula</span>
                    </div>
                    <p className="font-medium">{user.USU_MATRICULA || "Não informada"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span>Curso</span>
                    </div>
                    <p className="font-medium">{user.USU_CURSO_DESC || "Não informado"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Período</span>
                    </div>
                    <p className="font-medium">{user.USU_PERIODO_DESC || "Não informado"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Permissão</span>
                    </div>
                    <Badge variant="secondary">{getPermissaoLabel(user.USU_IDPERMISSAO)}</Badge>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleOpenEditName} variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Nome
                  </Button>
                  <Button onClick={handleOpenEditCurso} variant="outline" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Editar Curso/Período
                  </Button>
                  <Button onClick={() => setShowChangePasswordDialog(true)} variant="outline" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog: Editar Nome */}
      <Dialog open={showEditNameDialog} onOpenChange={setShowEditNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome</DialogTitle>
            <DialogDescription>
              Altere o nome de exibição do seu perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditNameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveName} disabled={savingName}>
              {savingName && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Curso/Período */}
      <Dialog open={showEditCursoDialog} onOpenChange={setShowEditCursoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Curso e Período</DialogTitle>
            <DialogDescription>
              Altere seu curso e período atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-curso">Curso</Label>
              <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                <SelectTrigger id="edit-curso">
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.CUR_ID} value={curso.CUR_ID.toString()}>
                      {curso.CUR_DESC}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-periodo">Período</Label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger id="edit-periodo">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.PER_ID} value={periodo.PER_ID.toString()}>
                      {periodo.PER_DESCRICAO}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCursoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCurso} disabled={savingCurso}>
              {savingCurso && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Alterar Senha */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua senha atual e a nova senha desejada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Digite sua senha atual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Digite sua nova senha"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirme sua nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowChangePasswordDialog(false)
              setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
            }}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
