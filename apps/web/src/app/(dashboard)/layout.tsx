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
import CompanySelector from '@/components/auth/company-selector'
import { useState } from 'react'
import { useAppearanceSettings } from '@/hooks/use-appearance-settings'
import { useAuth } from '@/hooks/use-auth'
import type { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const { settings } = useAppearanceSettings()
  const { requiresCompanySelection, company } = useAuth()

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
      {/* Si l'utilisateur doit sélectionner une société, AuthGuard s'occupe de l'affichage */}
      {requiresCompanySelection || !company ? (
        // AuthGuard affichera le CompanySelector, on ne rend rien ici
        children
      ) : (
        // Layout normal avec Header et Sidebar
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
              onShowCompanySelector={() => setShowCompanySelector(true)}
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
      )}
      
      {/* Modal de changement de société - Affiché au niveau racine pour éviter les contraintes de layout */}
      <CompanySelector
        open={showCompanySelector}
        onOpenChange={setShowCompanySelector}
        onCompanySelected={() => setShowCompanySelector(false)}
        showInDialog={true}
      />
    </AuthGuard>
  )
}
