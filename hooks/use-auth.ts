"use client"

import { useState, useEffect } from "react"

interface User {
  USU_ID: number | string
  USU_NOME: string
  USU_EMAIL: string
  USU_IDPERMISSAO?: number | string
  USU_IDCURSO?: number | string | null
  USU_IDPERIODO?: number | string | null
  USU_CURSO_DESC?: string
  USU_PERIODO_DESC?: string
  role?: string
  is_mentor?: boolean
  [key: string]: any
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('ajudaqi_user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Erro ao ler dados do usuário:', error)
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('ajudaqi_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  const logout = () => {
    localStorage.removeItem('ajudaqi_user')
    setUser(null)
  }

  return {
    user,
    loading,
    updateUser,
    logout,
    isAuthenticated: !!user,
  }
}

