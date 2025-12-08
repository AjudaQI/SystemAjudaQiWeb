"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface CoursesManagementProps {
  currentUser: any
}

interface Course {
  CUR_ID: number
  CUR_DESC: string
  CUR_ATIVO: boolean
}

interface Materia {
  MAT_ID: number
  MAT_DESC: string
  MAT_IDCURSO: number
  MAT_IDPERIODO: number
  MAT_DESCRICAOCONTEUDO?: string
  PER_DESCRICAO?: string
  CUR_DESC?: string
}

interface Periodo {
  PER_ID: number
  PER_DESCRICAO: string
  PER_ATIVO: boolean
}

export function CoursesManagement({ currentUser }: CoursesManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [loading, setLoading] = useState(true)
  const [courseModal, setCourseModal] = useState({
    isOpen: false,
    course: null as Course | null,
  })
  const [materiaModal, setMateriaModal] = useState({
    isOpen: false,
    materia: null as Materia | null,
    courseId: 0,
  })
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    isOpen: false,
    course: null as Course | null,
  })
  const [deleteMateriaConfirmDialog, setDeleteMateriaConfirmDialog] = useState({
    isOpen: false,
    materia: null as Materia | null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    try {
      // Buscar cursos
      const cursosRes = await fetch('/api/cursos')
      const cursosData = await cursosRes.json()
      if (cursosData.ok) {
        setCourses(cursosData.cursos || [])
      }

      // Buscar matérias
      const materiasRes = await fetch('/api/materias')
      const materiasData = await materiasRes.json()
      if (materiasData.ok) {
        setMaterias(materiasData.materias || [])
      }

      // Buscar períodos
      const periodosRes = await fetch('/api/periodos')
      const periodosData = await periodosRes.json()
      if (periodosData.ok) {
        setPeriodos(periodosData.periodos || [])
      }
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

  const handleSaveCourse = async (courseData: { descricao: string }) => {
    try {
      if (courseModal.course) {
        // Atualizar curso existente
        const response = await fetch('/api/cursos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: courseModal.course.CUR_ID,
            descricao: courseData.descricao,
            ativo: true
          })
        })

        const data = await response.json()
        
        if (data.ok) {
          toast({
            title: "Sucesso",
            description: data.message || "Curso atualizado com sucesso!",
          })
          fetchData()
          setCourseModal({ isOpen: false, course: null })
        } else {
          toast({
            title: "Erro",
            description: data.error || "Erro ao atualizar curso.",
            variant: "destructive",
          })
        }
      } else {
        // Criar novo curso
        const response = await fetch('/api/cursos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descricao: courseData.descricao })
        })

        const data = await response.json()
        
        if (data.ok) {
          toast({
            title: "Sucesso",
            description: data.message || "Curso criado com sucesso!",
          })
          fetchData()
          setCourseModal({ isOpen: false, course: null })
        } else {
          toast({
            title: "Erro",
            description: data.error || "Erro ao criar curso.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao salvar curso:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar curso.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourse = (course: Course) => {
    setDeleteConfirmDialog({ isOpen: true, course })
  }

  const confirmDeleteCourse = async () => {
    if (!deleteConfirmDialog.course) return

    const courseId = deleteConfirmDialog.course.CUR_ID

    try {
      const response = await fetch(`/api/cursos?id=${courseId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.ok) {
        toast({
          title: "Sucesso",
          description: data.message || "Curso excluído com sucesso!",
        })
        fetchData()
        setDeleteConfirmDialog({ isOpen: false, course: null })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao excluir curso.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir curso:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir curso.",
        variant: "destructive",
      })
    }
  }

  const handleSaveMateria = async (materiaData: { descricao: string, idPeriodo: number, descricaoConteudo?: string, idCurso: number }) => {
    try {
      console.log('Salvando matéria com dados:', materiaData)
      
      if (materiaModal.materia) {
        // Atualizar matéria existente
        const response = await fetch('/api/materias', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: materiaModal.materia.MAT_ID,
            descricao: materiaData.descricao,
            idCurso: materiaData.idCurso,
            idPeriodo: materiaData.idPeriodo,
            descricaoConteudo: materiaData.descricaoConteudo
          })
        })

        const data = await response.json()
        
        if (data.ok) {
          toast({
            title: "Sucesso",
            description: data.message || "Matéria atualizada com sucesso!",
          })
          fetchData()
          setMateriaModal({ isOpen: false, materia: null, courseId: 0 })
        } else {
          toast({
            title: "Erro",
            description: data.error || "Erro ao atualizar matéria.",
            variant: "destructive",
          })
        }
      } else {
        // Criar nova matéria
        const response = await fetch('/api/materias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            descricao: materiaData.descricao,
            idCurso: materiaData.idCurso,
            idPeriodo: materiaData.idPeriodo,
            descricaoConteudo: materiaData.descricaoConteudo
          })
        })

        const data = await response.json()
        
        if (data.ok) {
          toast({
            title: "Sucesso",
            description: data.message || "Matéria criada com sucesso!",
          })
          fetchData()
          setMateriaModal({ isOpen: false, materia: null, courseId: 0 })
        } else {
          toast({
            title: "Erro",
            description: data.error || "Erro ao criar matéria.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Erro ao salvar matéria:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar matéria.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMateria = (materia: Materia) => {
    setDeleteMateriaConfirmDialog({ isOpen: true, materia })
  }

  const confirmDeleteMateria = async () => {
    if (!deleteMateriaConfirmDialog.materia) return

    const materiaId = deleteMateriaConfirmDialog.materia.MAT_ID

    try {
      const response = await fetch(`/api/materias?id=${materiaId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.ok) {
        toast({
          title: "Sucesso",
          description: data.message || "Matéria excluída com sucesso!",
        })
        fetchData()
        setDeleteMateriaConfirmDialog({ isOpen: false, materia: null })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao excluir matéria.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir matéria:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir matéria.",
        variant: "destructive",
      })
    }
  }

  const getMateriasByCourse = (courseId: number) => {
    return materias.filter((materia) => materia.MAT_IDCURSO === courseId)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ajudaqi-text">Gestão de Cursos e Matérias</h2>
          <p className="text-ajudaqi-text-secondary">Gerencie os cursos e matérias da plataforma</p>
        </div>
        <Dialog open={courseModal.isOpen} onOpenChange={(open) => setCourseModal({ isOpen: open, course: null })}>
          <DialogTrigger asChild>
            <Button className="bg-ajudaqi-blue hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{courseModal.course ? "Editar Curso" : "Novo Curso"}</DialogTitle>
            </DialogHeader>
            <CourseForm course={courseModal.course} onSave={handleSaveCourse} onCancel={() => setCourseModal({ isOpen: false, course: null })} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum curso cadastrado ainda.</p>
            <p className="text-sm text-gray-400">Clique em "Novo Curso" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card key={course.CUR_ID} className="border-l-4 border-l-ajudaqi-blue">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-ajudaqi-blue"></div>
                    <CardTitle className="text-lg">{course.CUR_DESC}</CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setCourseModal({ isOpen: true, course })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCourse(course)}
                      className="text-ajudaqi-error hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Matérias ({getMateriasByCourse(course.CUR_ID).length})</h4>
                  <Dialog
                    open={materiaModal.isOpen && materiaModal.courseId === course.CUR_ID}
                    onOpenChange={(open) =>
                      setMateriaModal({ isOpen: open, materia: null, courseId: open ? course.CUR_ID : 0 })
                    }
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Matéria - {course.CUR_DESC}</DialogTitle>
                      </DialogHeader>
                      <MateriaForm 
                        materia={materiaModal.materia} 
                        periodos={periodos}
                        courseId={course.CUR_ID}
                        onSave={handleSaveMateria} 
                        onCancel={() => setMateriaModal({ isOpen: false, materia: null, courseId: 0 })}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-2">
                  {getMateriasByCourse(course.CUR_ID).length === 0 ? (
                    <p className="text-sm text-ajudaqi-text-secondary text-center py-4">Nenhuma matéria cadastrada</p>
                  ) : (
                    getMateriasByCourse(course.CUR_ID).map((materia) => (
                      <div key={materia.MAT_ID} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{materia.MAT_DESC}</span>
                          {materia.PER_DESCRICAO && (
                            <span className="text-xs text-ajudaqi-text-secondary ml-2">({materia.PER_DESCRICAO})</span>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMateriaModal({ isOpen: true, materia, courseId: course.CUR_ID })}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMateria(materia)}
                            className="text-ajudaqi-error hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog 
        open={deleteConfirmDialog.isOpen} 
        onOpenChange={(open) => setDeleteConfirmDialog({ isOpen: open, course: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-ajudaqi-text-secondary">
              Tem certeza que deseja excluir o curso <strong>{deleteConfirmDialog.course?.CUR_DESC}</strong>?
            </p>
            <p className="text-sm text-ajudaqi-text-secondary mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmDialog({ isOpen: false, course: null })}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteCourse}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão de Matéria */}
      <Dialog 
        open={deleteMateriaConfirmDialog.isOpen} 
        onOpenChange={(open) => setDeleteMateriaConfirmDialog({ isOpen: open, materia: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-ajudaqi-text-secondary">
              Tem certeza que deseja excluir a matéria <strong>{deleteMateriaConfirmDialog.materia?.MAT_DESC}</strong>?
            </p>
            <p className="text-sm text-ajudaqi-text-secondary mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteMateriaConfirmDialog({ isOpen: false, materia: null })}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteMateria}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CourseForm({ course, onSave, onCancel }: { course: Course | null; onSave: (data: { descricao: string }) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    descricao: course?.CUR_DESC || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "O nome do curso é obrigatório.",
        variant: "destructive",
      })
      return
    }
    
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="descricao" className="block text-sm font-medium mb-2">
          Nome do Curso *
        </Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Ciência da Computação"
          required
        />
      </div>

      <DialogFooter className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-ajudaqi-blue hover:bg-blue-700">
          {course ? "Atualizar" : "Criar"} Curso
        </Button>
      </DialogFooter>
    </form>
  )
}

function MateriaForm({ 
  materia, 
  periodos,
  courseId,
  onSave, 
  onCancel 
}: { 
  materia: Materia | null
  periodos: Periodo[]
  courseId: number
  onSave: (data: { descricao: string, idPeriodo: number, descricaoConteudo?: string, idCurso: number }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    descricao: materia?.MAT_DESC || "",
    idPeriodo: materia?.MAT_IDPERIODO || 0,
    descricaoConteudo: materia?.MAT_DESCRICAOCONTEUDO || "",
    idCurso: materia?.MAT_IDCURSO || courseId,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "O nome da matéria é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!formData.idPeriodo || formData.idPeriodo === 0) {
      toast({
        title: "Erro",
        description: "Selecione um período.",
        variant: "destructive",
      })
      return
    }

    if (!formData.idCurso || formData.idCurso === 0) {
      toast({
        title: "Erro",
        description: "Curso é obrigatório.",
        variant: "destructive",
      })
      return
    }
    
    console.log('Enviando dados do formulário:', formData)
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="descricao" className="block text-sm font-medium mb-2">
          Nome da Matéria *
        </Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: Programação Orientada a Objetos"
          required
        />
      </div>

      <div>
        <Label htmlFor="periodo" className="block text-sm font-medium mb-2">
          Período *
        </Label>
        <Select
          value={formData.idPeriodo.toString()}
          onValueChange={(value) => setFormData({ ...formData, idPeriodo: parseInt(value) })}
        >
          <SelectTrigger>
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

      <div>
        <Label htmlFor="descricaoConteudo" className="block text-sm font-medium mb-2">
          Descrição do Conteúdo
        </Label>
        <Textarea
          id="descricaoConteudo"
          value={formData.descricaoConteudo}
          onChange={(e) => setFormData({ ...formData, descricaoConteudo: e.target.value })}
          placeholder="Descrição do conteúdo da matéria (opcional)"
          rows={3}
        />
      </div>

      <DialogFooter className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-ajudaqi-blue hover:bg-blue-700">
          {materia ? "Atualizar" : "Criar"} Matéria
        </Button>
      </DialogFooter>
    </form>
  )
}

