"use client"

import { Suspense } from "react"
import { SolicitacoesPageContent } from "../page"
import { AuthGuard } from "@/components/auth-guard"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function SolicitacoesPageWithPagination() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingSpinner />}>
        <SolicitacoesPageContent />
      </Suspense>
    </AuthGuard>
  )
}

