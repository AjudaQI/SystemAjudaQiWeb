"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export function VersionLabel() {
  const [version, setVersion] = useState<string>("—")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version')
        const data = await response.json()
        
        if (data.ok && data.tag) {
          setVersion(data.tag)
        } else {
          setVersion("v0.0.0")
        }
      } catch (error) {
        console.error('Erro ao buscar versão:', error)
        setVersion("v0.0.0")
      } finally {
        setLoading(false)
      }
    }

    fetchVersion()
  }, [])

  if (loading) {
    return (
      <Badge variant="outline" className="text-xs opacity-50">
        Carregando...
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-xs font-mono">
      {version}
    </Badge>
  )
}

