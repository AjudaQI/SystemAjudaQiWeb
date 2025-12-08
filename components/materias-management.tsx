"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, BookOpen, Loader2 } from "lucide-react"

interface Materia {
  MAT_ID: number
  MAT_DESC: string
  MAT_IDCURSO: number
  MAT_IDPERIODO: number
  MAT_DESCRICAOCONTEUDO?: string
  CUR_DESC?: string
  PER_DESCRICAO?: string
}

interface Curso {
  CUR_ID: number
  CUR_DESC: string
}

interface Periodo {
  PER_ID: number
  PER_DESCRICAO: string
}

export function MateriasManagement() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Dialog states
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null)
  
  // Form states
  const [descricao, setDescricao] = useState("")
  const [idCurso, setIdCurso] = useState("")
  const [idPeriodo, setIdPeriodo] = useState("")
  const [descricaoConteudo, setDescricaoConteudo] = useState("")

  // Filter states
  const [filterCurso, setFilterCurso] = useState("")
  const [filterPeriodo, setFilterPeriodo] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (filterCurso || filterPeriodo) {
      fetchMaterias()
    }
  }, [filterCurso, filterPeriodo])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchMaterias(),
        fetchCursos(),
        fetchPeriodos()
      ])
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterias = async () => {
    try {
      let url = '/api/materias'
      const params = new URLSearchParams()
      if (filterCurso) params.append('cursoId', filterCurso)
      if (filterPeriodo) params.append('periodoId', filterPeriodo)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()
      
      if (data.ok) {
        setMaterias(data.materias || [])
      }
    } catch (error) {
      console.error("Erro ao buscar matérias:", error)
    }
  }

  const fetchCursos = async () => {
    try {
      const response = await fetch('/api/cursos')
      const data = await response.json()
      
      if (data.ok) {
        setCursos(data.cursos || [])
      }
    } catch (error) {
      console.error("Erro ao buscar cursos:", error)
    }
  }

  const fetchPeriodos = async () => {
    try {
      const response = await fetch('/api/periodos')
      const data = await response.json()
      
      if (data.ok) {
        setPeriodos(data.periodos || [])
      }
    } catch (error) {
      console.error("Erro ao buscar períodos:", error)
    }
  }

  const handleOpenDialog = (mode: "create" | "edit", materia?: Materia) => {
    setDialogMode(mode)
    
    if (mode === "edit" && materia) {
      setSelectedMateria(materia)
      setDescricao(materia.MAT_DESC)
      setIdCurso(materia.MAT_IDCURSO.toString())
      setIdPeriodo(materia.MAT_IDPERIODO.toString())
      setDescricaoConteudo(materia.MAT_DESCRICAOCONTEUDO || "")
    } else {
      setSelectedMateria(null)
      setDescricao("")
      setIdCurso("")
      setIdPeriodo("")
      setDescricaoConteudo("")
    }
    
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setSelectedMateria(null)
    setDescricao("")
    setIdCurso("")
    setIdPeriodo("")
    setDescricaoConteudo("")
  }

  const handleSubmit = async () => {
    if (!descricao.trim() || !idCurso || !idPeriodo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      const url = '/api/materias'
      const method = dialogMode === "create" ? "POST" : "PUT"
      const body = {
        ...(dialogMode === "edit" && { id: selectedMateria?.MAT_ID }),
        descricao: descricao.trim(),
        idCurso: parseInt(idCurso),
        idPeriodo: parseInt(idPeriodo),
        descricaoConteudo: descricaoConteudo.trim() || null
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.ok) {
        toast({
          title: "Sucesso",
          description: data.message || `Matéria ${dialogMode === "create" ? "criada" : "atualizada"} com sucesso!`
        })
        handleCloseDialog()
        fetchMaterias()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao salvar matéria.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao salvar matéria:", error)
      toast({
        title: "Erro",
        description: "Falha ao salvar matéria.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (materiaId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta matéria?")) {
      return
    }

    try {
      const response = await fetch(`/api/materias?id=${materiaId}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.ok) {
        toast({
          title: "Sucesso",
          description: "Matéria excluída com sucesso!"
        })
        fetchMaterias()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao excluir matéria.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao excluir matéria:", error)
      toast({
        title: "Erro",
        description: "Falha ao excluir matéria.",
        variant: "destructive"
      })
    }
  }

  const filteredMaterias = materias

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Gerenciamento de Matérias
              </CardTitle>
              <CardDescription>
                Gerencie as matérias disponíveis por curso e período
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog("create")}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Matéria
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <Label>Filtrar por Curso</Label>
              <Select value={filterCurso || "all"} onValueChange={(value) => setFilterCurso(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.CUR_ID} value={curso.CUR_ID.toString()}>
                      {curso.CUR_DESC}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Filtrar por Período</Label>
              <Select value={filterPeriodo || "all"} onValueChange={(value) => setFilterPeriodo(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.PER_ID} value={periodo.PER_ID.toString()}>
                      {periodo.PER_DESCRICAO}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de Matérias */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMaterias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma matéria encontrada
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matéria</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Descrição do Conteúdo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterias.map((materia) => (
                    <TableRow key={materia.MAT_ID}>
                      <TableCell className="font-medium">{materia.MAT_DESC}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{materia.CUR_DESC}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{materia.PER_DESCRICAO}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {materia.MAT_DESCRICAOCONTEUDO || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog("edit", materia)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(materia.MAT_ID)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Criar/Editar Matéria */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Nova Matéria" : "Editar Matéria"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create" 
                ? "Preencha os dados para criar uma nova matéria" 
                : "Atualize os dados da matéria"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="descricao">
                Nome da Matéria <span className="text-red-500">*</span>
              </Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Cálculo I, Programação Web, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="curso">
                  Curso <span className="text-red-500">*</span>
                </Label>
                <Select value={idCurso} onValueChange={setIdCurso}>
                  <SelectTrigger id="curso">
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

              <div className="grid gap-2">
                <Label htmlFor="periodo">
                  Período <span className="text-red-500">*</span>
                </Label>
                <Select value={idPeriodo} onValueChange={setIdPeriodo}>
                  <SelectTrigger id="periodo">
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

            <div className="grid gap-2">
              <Label htmlFor="descricaoConteudo">Descrição do Conteúdo</Label>
              <Textarea
                id="descricaoConteudo"
                value={descricaoConteudo}
                onChange={(e) => setDescricaoConteudo(e.target.value)}
                placeholder="Descreva os tópicos e conteúdos abordados nesta matéria..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                dialogMode === "create" ? "Criar Matéria" : "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
