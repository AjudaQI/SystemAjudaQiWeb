"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks"
import { toast } from "@/components/ui/use-toast"

interface Comentario {
  COM_IDCOMENTARIO: number
  COM_IDRESPOSTA: number
  COM_IDUSUARIO: number | string
  COM_TEXTO: string
  COM_DATACOMENTARIO: string
  USU_NOME: string
  USU_IDPERMISSAO: number
}

interface ComentariosProps {
  idResposta: number
  idDuvida: number
  idAutorDuvida: number | string
}

export function Comentarios({ idResposta, idDuvida, idAutorDuvida }: ComentariosProps) {
  const { user } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(false)
  const [novoComentario, setNovoComentario] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarTodos, setMostrarTodos] = useState(false)

  const carregarComentarios = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/comentarios?idResposta=${idResposta}`)
      const data = await response.json()

      if (data.ok) {
        setComentarios(data.comentarios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarComentarios()
  }, [idResposta])

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim()) {
      toast({
        title: "Erro",
        description: "Digite um comentário",
        variant: "destructive"
      })
      return
    }

    setEnviando(true)
    try {
      const response = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idResposta,
          idUsuario: typeof user?.USU_ID === 'string' ? parseInt(user.USU_ID) : user?.USU_ID,
          texto: novoComentario.trim()
        })
      })

      const data = await response.json()

      if (data.ok) {
        setComentarios([...comentarios, data.comentario])
        setNovoComentario("")
        setMostrarFormulario(false)
        toast({
          title: "Sucesso",
          description: "Comentário enviado!"
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao enviar comentário",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      toast({
        title: "Erro",
        description: "Falha ao enviar comentário",
        variant: "destructive"
      })
    } finally {
      setEnviando(false)
    }
  }

  const handleDeletarComentario = async (idComentario: number) => {
    if (!confirm('Deseja realmente deletar este comentário?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/comentarios?id=${idComentario}&idUsuario=${typeof user?.USU_ID === 'string' ? parseInt(user.USU_ID) : user?.USU_ID}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (data.ok) {
        setComentarios(comentarios.filter(c => c.COM_IDCOMENTARIO !== idComentario))
        toast({
          title: "Sucesso",
          description: "Comentário deletado"
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao deletar comentário",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erro ao deletar comentário:', error)
      toast({
        title: "Erro",
        description: "Falha ao deletar comentário",
        variant: "destructive"
      })
    }
  }

  const formatarData = (data: string) => {
    const date = new Date(data)
    const agora = new Date()
    const diff = agora.getTime() - date.getTime()
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(diff / 3600000)
    const dias = Math.floor(diff / 86400000)

    if (minutos < 1) return 'agora'
    if (minutos < 60) return `${minutos}min atrás`
    if (horas < 24) return `${horas}h atrás`
    if (dias < 7) return `${dias}d atrás`
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const podeEditar = (comentario: Comentario) => {
    const userId = typeof user?.USU_ID === 'string' ? parseInt(user.USU_ID) : user?.USU_ID
    const comentarioUserId = typeof comentario.COM_IDUSUARIO === 'string' 
      ? parseInt(comentario.COM_IDUSUARIO) 
      : comentario.COM_IDUSUARIO
    
    return userId === comentarioUserId || user?.USU_IDPERMISSAO === 2
  }

  return (
    <div className="space-y-3">
      {/* Header com contador */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{comentarios.length} {comentarios.length === 1 ? 'comentário' : 'comentários'}</span>
        </div>
        
        {!mostrarFormulario && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Comentar
          </Button>
        )}
      </div>

      {/* Área de comentários com scroll limitado */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comentarios.length > 0 ? (
        <div className="space-y-2">
          {/* Container com altura máxima e scroll independente - mais compacto */}
          <div className="max-h-[150px] overflow-y-auto space-y-2 pr-2 comments-scrollbar">
            {/* Primeiro comentário */}
            {comentarios.slice(0, 1).map((comentario) => (
              <Card key={comentario.COM_IDCOMENTARIO} className="p-3 bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comentario.USU_NOME}</span>
                      {comentario.COM_IDUSUARIO.toString() === idAutorDuvida.toString() && (
                        <Badge variant="secondary" className="text-xs">Autor</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatarData(comentario.COM_DATACOMENTARIO)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comentario.COM_TEXTO}</p>
                  </div>
                  
                  {podeEditar(comentario) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeletarComentario(comentario.COM_IDCOMENTARIO)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            
            {/* Comentários adicionais */}
            {mostrarTodos && comentarios.length > 1 && (
              <>
                {comentarios.slice(1).map((comentario) => (
                  <Card key={comentario.COM_IDCOMENTARIO} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comentario.USU_NOME}</span>
                          {comentario.COM_IDUSUARIO.toString() === idAutorDuvida.toString() && (
                            <Badge variant="secondary" className="text-xs">Autor</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatarData(comentario.COM_DATACOMENTARIO)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comentario.COM_TEXTO}</p>
                      </div>
                      
                      {podeEditar(comentario) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletarComentario(comentario.COM_IDCOMENTARIO)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
          
          {/* Botão de ver mais/menos - fora da área de scroll */}
          {comentarios.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMostrarTodos(!mostrarTodos)}
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {mostrarTodos 
                ? 'Mostrar menos' 
                : `Ver mais ${comentarios.length - 1} comentário${comentarios.length - 1 > 1 ? 's' : ''}`
              }
            </Button>
          )}
        </div>
      ) : null}

      {/* Formulário de novo comentário */}
      {mostrarFormulario && (
        <Card className="p-3 space-y-2">
          <Textarea
            placeholder="Digite seu comentário ou agradecimento..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={enviando}
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMostrarFormulario(false)
                setNovoComentario("")
              }}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleEnviarComentario}
              disabled={enviando || !novoComentario.trim()}
              className="flex items-center gap-2"
            >
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
