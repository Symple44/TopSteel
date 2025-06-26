// apps/web/src/app/layout.tsx
import { Providers } from '@/components/providers'
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TOPSTEEL - ERP métallurgie - Gestion d\'entreprise',
  description: 'Solution ERP complète pour les entreprises de construction métallique et métallurgie',
  keywords: 'ERP, construction métallique, métallerie, ferronnerie, gestion, production, stocks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}