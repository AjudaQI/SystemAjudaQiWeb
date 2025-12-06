"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Users, MessageCircle, Trophy, Clock, Star, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [matricula, setMatricula] = useState("")
  const [cpf, setCpf] = useState("")
  const [curso, setCurso] = useState<string>("")
  const [periodo, setPeriodo] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cpfError, setCpfError] = useState<string | null>(null)
  const router = useRouter()
  const [tab, setTab] = useState("login")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Função para aplicar máscara de CPF
  const applyCpfMask = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11)
    
    // Aplica a máscara
    if (limitedNumbers.length <= 3) {
      return limitedNumbers
    } else if (limitedNumbers.length <= 6) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`
    } else if (limitedNumbers.length <= 9) {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6)}`
    } else {
      return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9, 11)}`
    }
  }

  // Função para validar CPF
  const validateCpf = (cpf: string): boolean => {
    // Remove formatação
    const numbers = cpf.replace(/\D/g, '')
    
    // Verifica se tem 11 dígitos
    if (numbers.length !== 11) {
      return false
    }
    
    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(numbers)) {
      return false
    }
    
    // Validação dos dígitos verificadores
    let sum = 0
    let remainder
    
    // Valida primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(numbers.substring(9, 10))) {
      return false
    }
    
    // Valida segundo dígito verificador
    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (12 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(numbers.substring(10, 11))) {
      return false
    }
    
    return true
  }

  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data?.error || "Usuário ou senha inválidos.")
        return
      }
      // Salvar dados do usuário no localStorage
      if (data.user) {
        localStorage.setItem('ajudaqi_user', JSON.stringify(data.user))
      }
      router.push("/dashboard")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    // Valida CPF antes de enviar
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length !== 11 || !validateCpf(cpf)) {
      setCpfError('CPF inválido')
      setSubmitting(false)
      return
    }
    
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: name,
          email,
          senha: password,
          matricula: Number(matricula),
          cpf: cpf.replace(/\D/g, ''),
          curso: curso ? Number(curso) : undefined,
          periodo: periodo ? Number(periodo) : undefined,
          // idPermissao default 3 (servidor)
        })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        // Conflitos estruturados do backend
        if (data?.conflicts) {
          const msgs: string[] = []
          if (data.conflicts.email) msgs.push('E-mail já está cadastrado.')
          if (data.conflicts.cpf) msgs.push('CPF já está cadastrado.')
          if (data.conflicts.matricula) msgs.push('Matrícula já está cadastrada.')
          if (msgs.length) throw new Error(msgs.join(' '))
        }
        
        // Se houver issues de validação, usar a mensagem detalhada
        let customMsg = data?.error || 'Falha ao registrar';
        
        // Melhorar mensagens específicas
        if (/matr[ií]cula.*cadastrada/i.test(customMsg)) customMsg = 'Matrícula já está cadastrada.';
        if (/email.*cadastrado/i.test(customMsg)) customMsg = 'E-mail já está cadastrado.';
        if (/cpf.*cadastrado/i.test(customMsg)) customMsg = 'CPF já está cadastrado.';
        if (/cpf.*inv[aá]lido/i.test(customMsg)) customMsg = 'CPF inválido.';
        
        // Se a mensagem já for específica (não é apenas "Dados inválidos"), usar ela
        if (customMsg !== 'Dados inválidos' || !data?.issues) {
          throw new Error(customMsg);
        }
        
        // Se for "Dados inválidos" e houver issues, construir mensagem detalhada
        if (data.issues) {
          const fieldErrors: string[] = []
          if (data.issues.fieldErrors) {
            Object.entries(data.issues.fieldErrors).forEach(([field, errors]) => {
              const fieldName = field === 'nome' ? 'Nome' : 
                               field === 'email' ? 'E-mail' : 
                               field === 'senha' ? 'Senha' : 
                               field === 'cpf' ? 'CPF' : 
                               field === 'matricula' ? 'Matrícula' :
                               field === 'curso' ? 'Curso' :
                               field === 'periodo' ? 'Período' : field
              if (Array.isArray(errors) && errors.length > 0) {
                fieldErrors.push(`${fieldName}: ${errors[0]}`)
              }
            })
          }
          throw new Error(fieldErrors.length > 0 ? fieldErrors.join(' ') : customMsg)
        }
        
        throw new Error(customMsg);
      }
      setShowSuccessDialog(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-72 h-72 gradient-primary rounded-full opacity-20 blur-3xl float-animation"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 gradient-secondary rounded-full opacity-20 blur-3xl float-animation" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 gradient-accent rounded-full opacity-10 blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Seção de Informações sobre o Sistema */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <div className="p-4 rounded-2xl gradient-primary pulse-glow">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold mb-2">Ajudaqi</h1>
                <p className="text-xl text-muted-foreground">Conectando estudantes através da colaboração</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="modern-card border-0 hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl gradient-primary">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Ajuda por Matéria</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Solicite e ofereça ajuda em matérias específicas do seu curso. Conecte-se com colegas que podem te
                  auxiliar nos estudos de forma direcionada e eficiente.
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card border-0 hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl gradient-secondary">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Comunidade por Curso</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Acesse dúvidas e ajudas apenas do seu curso e período. Mantenha o foco no que realmente importa para
                  você e sua jornada acadêmica.
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card border-0 hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl gradient-accent">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Chat Integrado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Converse diretamente com quem pode te ajudar. Sistema de chat em tempo real para tirar dúvidas
                  rapidamente e manter a comunicação fluida.
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card border-0 hover:scale-105 transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl gradient-full">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Sistema de Conquistas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Ganhe horas e conquistas ajudando outros estudantes. Construa sua reputação na comunidade acadêmica
                  e seja reconhecido pelo seu conhecimento.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <Badge className="gradient-primary text-white border-0 flex items-center gap-2 px-4 py-2">
              <Clock className="h-4 w-4" />
              Sistema de Horas
            </Badge>
            <Badge className="gradient-secondary text-white border-0 flex items-center gap-2 px-4 py-2">
              <Star className="h-4 w-4" />
              Avaliações
            </Badge>
            <Badge className="gradient-accent text-white border-0 px-4 py-2">
              Prioridades
            </Badge>
          </div>
        </div>

        {/* Seção de Login/Registro */}
        <div className="w-full max-w-lg mx-auto">
          <Card className="modern-card border-0 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-2xl gradient-primary">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl">Bem-vindo ao Ajudaqi</CardTitle>
              </div>
              <CardDescription className="text-lg">Entre na sua conta ou crie uma nova para começar</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Tabs value={tab} onValueChange={setTab} defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="login" className="rounded-lg">Entrar</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg">Registrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6 mt-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-medium">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu.email@universidade.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-base font-medium">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                    <Button disabled={submitting} type="submit" className="w-full h-12 modern-button rounded-xl text-lg font-semibold">
                      {submitting ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-6 mt-8">
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-base font-medium">Nome Completo</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => {
                          // Remove números do nome
                          const valueWithoutNumbers = e.target.value.replace(/[0-9]/g, '')
                          setName(valueWithoutNumbers)
                        }}
                        className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-email" className="text-base font-medium">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu.email@universidade.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="matricula" className="text-base font-medium">Matrícula</Label>
                        <Input
                          id="matricula"
                          type="number"
                          placeholder="20250001"
                          value={matricula}
                          onChange={(e) => setMatricula(e.target.value)}
                          className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="cpf" className="text-base font-medium">CPF</Label>
                        <Input
                          id="cpf"
                          type="text"
                          placeholder="123.456.789-10"
                          value={cpf}
                          onChange={(e) => {
                            const maskedValue = applyCpfMask(e.target.value)
                            setCpf(maskedValue)
                            
                            // Valida CPF apenas se tiver 11 dígitos
                            const numbers = maskedValue.replace(/\D/g, '')
                            if (numbers.length === 11) {
                              const isValid = validateCpf(maskedValue)
                              setCpfError(isValid ? null : 'CPF inválido')
                            } else {
                              setCpfError(null)
                            }
                          }}
                          className={`h-12 rounded-xl border-2 focus:border-primary transition-colors ${cpfError ? 'border-red-500' : ''}`}
                          required
                        />
                        {cpfError && (
                          <p className="text-sm text-red-600">{cpfError}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="curso" className="text-base font-medium">Curso</Label>
                        <Select value={curso} onValueChange={setCurso} required>
                          <SelectTrigger className="h-12 w-full rounded-xl border-2 border-input focus:border-primary transition-colors">
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
                      <div className="space-y-3">
                        <Label htmlFor="periodo" className="text-base font-medium">Período</Label>
                        <Select value={periodo} onValueChange={setPeriodo} required>
                          <SelectTrigger className="h-12 w-full rounded-xl border-2 border-input focus:border-primary transition-colors">
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
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-password" className="text-base font-medium">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                        required
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                    <Button disabled={submitting} type="submit" className="w-full h-12 modern-button rounded-xl text-lg font-semibold">
                      {submitting ? 'Criando Conta...' : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={(v) => {
        setShowSuccessDialog(v)
        if (!v) {
          setTab("login")
          setEmail("")
          setPassword("")
          setName("")
          setMatricula("")
          setCpf("")
          setCpfError(null)
          setCurso("")
          setPeriodo("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conta criada com sucesso!</DialogTitle>
            <DialogDescription>
              Agora você pode realizar o login utilizando seu e-mail e senha.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}

