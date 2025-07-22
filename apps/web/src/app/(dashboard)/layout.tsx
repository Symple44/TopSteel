'use client'

/**
 * Layout Dashboard - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/layout.tsx
 * CORRIGÉ - Ne redéfinit plus HTML/BODY
 */

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthGuard } from '@/components/auth/auth-guard'
import { AutoBreadcrumb } from '@/components/ui/auto-breadcrumb'
import { useState } from 'react'
import { useAppearanceSettings } from '@/hooks/use-appearance-settings'
import type { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { settings } = useAppearanceSettings()

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Déterminer la classe de largeur en fonction du paramètre utilisateur
  const getContainerClass = () => {
    if (settings.contentWidth === 'full') {
      return 'w-full' // Pleine largeur
    }
    return 'mx-auto max-w-7xl' // Largeur limitée (comportement actuel)
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
        />

        {/* Contenu principal */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header 
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          {/* Zone de contenu */}
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            <div className={getContainerClass()}>
              <AutoBreadcrumb />
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
