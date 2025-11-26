'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import CompanySelector from '../../components/auth/company-selector'
import { Header } from '../../components/layout/header'
import { Sidebar } from '../../components/layout/sidebar'
import { AutoBreadcrumbWrapper } from '../../components/wrappers'
import { useApiConnection } from '../../hooks/use-api-connection'
import { useAppearanceSettings } from '../../hooks/use-appearance-settings'

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

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev)
  }, [])

  // Keyboard shortcut: Ctrl+B to toggle sidebar (like VS Code)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        handleToggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleSidebar])

  // Déterminer la classe de largeur en fonction du paramètre utilisateur
  const getContainerClass = () => {
    if (settings.contentWidth === 'full') {
      return 'w-full'
    }
    return 'mx-auto max-w-7xl'
  }

  // Afficher seulement les enfants (sans layout) si la sélection de société est requise
  if (requiresCompanySelection) {
    return children
  }

  return (
    <>
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
          <main className="flex-1 overflow-auto bg-muted/30 p-4">
            <div className={getContainerClass()}>
              <AutoBreadcrumbWrapper />
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Modal de changement de société */}
      <CompanySelector
        open={showCompanySelector}
        onOpenChange={setShowCompanySelector}
        onCompanySelected={() => setShowCompanySelector(false)}
        showInDialog={true}
      />
    </>
  )
}
