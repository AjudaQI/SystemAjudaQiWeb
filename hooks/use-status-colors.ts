"use client"

import React from "react"
import { AlertCircle, Clock, Zap, CheckCircle } from "lucide-react"

/**
 * Hook para obter cores e ícones de status/prioridade
 */
export function useStatusColors() {
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pending":
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "investigating":
      case "em-andamento":
        return "bg-blue-100 text-blue-800"
      case "resolved":
      case "resolvida":
        return "bg-green-100 text-green-800"
      case "dismissed":
      case "descartado":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendente"
      case "investigating":
        return "Investigando"
      case "resolved":
        return "Resolvido"
      case "dismissed":
        return "Descartado"
      case "pendente":
        return "Pendente"
      case "em-andamento":
        return "Em Andamento"
      case "resolvida":
        return "Resolvida"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string): "destructive" | "secondary" | "outline" => {
    switch (priority.toLowerCase()) {
      case "alta":
      case "high":
        return "destructive"
      case "media":
      case "medium":
        return "secondary"
      case "baixa":
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPriorityIcon = (priority: string): React.ReactElement => {
    switch (priority.toLowerCase()) {
      case "alta":
      case "high":
        return React.createElement(Zap, { className: "h-4 w-4 text-destructive" })
      case "media":
      case "medium":
        return React.createElement(Clock, { className: "h-4 w-4 text-secondary" })
      case "baixa":
      case "low":
        return React.createElement(AlertCircle, { className: "h-4 w-4 text-muted-foreground" })
      default:
        return React.createElement(Clock, { className: "h-4 w-4" })
    }
  }

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status.toLowerCase()) {
      case "pending":
      case "pendente":
        return React.createElement(AlertCircle, { className: "h-4 w-4 text-destructive" })
      case "investigating":
      case "em-andamento":
        return React.createElement(Clock, { className: "h-4 w-4 text-secondary" })
      case "resolved":
      case "resolvida":
        return React.createElement(CheckCircle, { className: "h-4 w-4 text-green-500" })
      default:
        return React.createElement(AlertCircle, { className: "h-4 w-4" })
    }
  }

  return {
    getStatusColor,
    getStatusText,
    getPriorityColor,
    getPriorityIcon,
    getStatusIcon,
  }
}

