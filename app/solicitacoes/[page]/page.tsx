"use client"

import { SolicitacoesPageContent } from "../page"
import { AuthGuard } from "@/components/auth-guard"

export default function SolicitacoesPageWithPagination() {
  return (
    <AuthGuard>
      <SolicitacoesPageContent />
    </AuthGuard>
  )
}

