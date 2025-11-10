'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import CompanySelector from '@/components/auth/company-selector'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AutoBreadcrumbWrapper } from '@/components/wrappers'
import { useApiConnection } from '@/hooks/use-api-connection'
import { useAppearanceSettings } from '@/hooks/use-appearance-settings'

interface DashboardContentProps {
  children: ReactNode
  requiresCompanySelection: boolean
  company: { id: string; name: string; logo?: string } | null
}

export function DashboardContent({
  children,
  requiresCompanySelection,
  company,
}: DashboardContentProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const { settings } = useAppearanceSettings()

  // Utiliser le hook de connexion API
  useApiConnection()

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

  // Afficher seulement les enfants (sans layout) si la sélection de société est requise
  // Les SUPER_ADMIN peuvent accéder au layout même sans société (company peut être null)
  if (requiresCompanySelection) {
    return children
  }

  return (
    <>
      {/* Layout normal avec Header et Sidebar */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />

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
              <AutoBreadcrumbWrapper />
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Modal de changement de société - Affiché au niveau racine pour éviter les contraintes de layout */}
      <CompanySelector
        open={showCompanySelector}
        onOpenChange={setShowCompanySelector}
        onCompanySelected={() => setShowCompanySelector(false)}
        showInDialog={true}
      />
    </>
  )
}
