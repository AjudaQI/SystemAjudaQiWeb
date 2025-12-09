"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Eye, EyeOff } from "lucide-react"
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
  const [cursos, setCursos] = useState<Array<{ CUR_ID: number; CUR_DESC: string }>>([])
  const [showPassword, setShowPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  // Buscar cursos do banco de dados
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch('/api/cursos')
        const data = await res.json()
        if (data.ok && data.cursos) {
          setCursos(data.cursos)
        }
      } catch (err) {
        console.error('Erro ao buscar cursos:', err)
      }
    }
    fetchCursos()
  }, [])

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <Card className="border shadow-lg">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">AjudaQI</CardTitle>
            </div>
            <CardDescription>Entre na sua conta ou crie uma nova</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs value={tab} onValueChange={setTab} defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Registrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@universidade.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button disabled={submitting} type="submit" className="w-full">
                    {submitting ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => {
                        const valueWithoutNumbers = e.target.value.replace(/[0-9]/g, '')
                        setName(valueWithoutNumbers)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu.email@universidade.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="matricula">Matrícula</Label>
                      <Input
                        id="matricula"
                        type="number"
                        placeholder="20250001"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="123.456.789-10"
                        value={cpf}
                        onChange={(e) => {
                          const maskedValue = applyCpfMask(e.target.value)
                          setCpf(maskedValue)
                          const numbers = maskedValue.replace(/\D/g, '')
                          if (numbers.length === 11) {
                            const isValid = validateCpf(maskedValue)
                            setCpfError(isValid ? null : 'CPF inválido')
                          } else {
                            setCpfError(null)
                          }
                        }}
                        className={cpfError ? 'border-destructive' : ''}
                        required
                      />
                      {cpfError && (
                        <p className="text-sm text-destructive">{cpfError}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="curso">Curso</Label>
                      <Select value={curso} onValueChange={setCurso} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {cursos.map((c) => (
                            <SelectItem key={c.CUR_ID} value={c.CUR_ID.toString()}>
                              {c.CUR_DESC}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodo">Período</Label>
                      <Select value={periodo} onValueChange={setPeriodo} required>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showRegisterPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <Button disabled={submitting} type="submit" className="w-full">
                    {submitting ? 'Criando Conta...' : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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

