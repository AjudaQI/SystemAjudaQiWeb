import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import "../styles/globals.css"
import { HelpRequestsProvider } from "@/lib/help-requests-context"
import { Toaster } from "@/components/ui/toaster"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "Ajudaqi - Plataforma de Ajuda Universitária",
  description: "Conectando estudantes universitários através da colaboração e ajuda mútua",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        <HelpRequestsProvider>
          {children}
          <Toaster />
        </HelpRequestsProvider>
      </body>
    </html>
  )
}
