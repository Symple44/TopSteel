/**
 * Layout Dashboard - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/layout.tsx
 * CORRIGÉ - Ne redéfinit plus HTML/BODY
 */

import type { ReactNode } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Zone de contenu */}
        <main className="flex-1 overflow-auto bg-gray-50/50 p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
