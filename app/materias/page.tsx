"use client"

import { Sidebar } from "@/components/sidebar"
import { MateriasManagement } from "@/components/materias-management"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks"
import { perfilStyles } from "@/app/perfil/style"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

function MateriasPageContent() {
  const [activeSection, setActiveSection] = useState("materias")
  const { user } = useAuth()

  // Verificar se o usuário é administrador (ID 2)
  const isAdmin = user?.USU_IDPERMISSAO === 2 || user?.USU_IDPERMISSAO === "2"

  if (!user) {
    return <div>Carregando...</div>
  }

  if (!isAdmin) {
    return (
      <div className={perfilStyles.container}>
        <div className={perfilStyles.background}>
          <div className={perfilStyles.gradient1}></div>
          <div className={perfilStyles.gradient2}></div>
          <div className={perfilStyles.gradient3}></div>
        </div>
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className={perfilStyles.main}>
          <div className={perfilStyles.content}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acesso Negado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-ajudaqi-text-secondary">
                    Você não tem permissão para acessar esta área. 
                    Apenas administradores podem gerenciar matérias.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={perfilStyles.container}>
      {/* Background Elements */}
      <div className={perfilStyles.background}>
        <div className={perfilStyles.gradient1}></div>
        <div className={perfilStyles.gradient2}></div>
        <div className={perfilStyles.gradient3}></div>
      </div>

      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className={perfilStyles.main}>
        <div className={perfilStyles.content}>
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-ajudaqi-text">
                Gerenciar Matérias
              </h1>
              <p className="text-ajudaqi-text-secondary">
                Gerencie as matérias disponíveis por curso e período
              </p>
            </div>

            {/* Materias Management Component */}
            <MateriasManagement />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function MateriasPage() {
  return (
    <AuthGuard>
      <MateriasPageContent />
    </AuthGuard>
  )
}
