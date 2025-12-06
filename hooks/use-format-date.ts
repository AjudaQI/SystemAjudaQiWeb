"use client"

/**
 * Hook para formatação de datas
 */
export function useFormatDate() {
  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString("pt-BR")
  }

  const formatDateTime = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTimeAgo = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return "Agora mesmo"
    if (diffInHours < 24) return `${diffInHours}h atrás`
    if (diffInDays === 1) return "1 dia atrás"
    if (diffInDays < 7) return `${diffInDays} dias atrás`
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} semana${weeks > 1 ? "s" : ""} atrás`
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} mês${months > 1 ? "es" : ""} atrás`
    }
    const years = Math.floor(diffInDays / 365)
    return `${years} ano${years > 1 ? "s" : ""} atrás`
  }

  return {
    formatDate,
    formatDateTime,
    formatTimeAgo,
  }
}

