'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import CompanySelector from '../../components/auth/company-selector'
import { Header } from '../../components/layout/header'
import { Sidebar } from '../../components/layout/sidebar'
import { AutoBreadcrumbWrapper } from '../../components/wrappers'
import { useApiConnection } from '../../hooks/use-api-connection'

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

  useApiConnection()

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev)
  }, [])

  // Keyboard shortcut: Ctrl+B to toggle sidebar
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

  if (requiresCompanySelection) {
    return children
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
            onShowCompanySelector={() => setShowCompanySelector(true)}
          />

          <main className="flex-1 overflow-auto bg-muted/20 p-4">
            <AutoBreadcrumbWrapper />
            {children}
          </main>
        </div>
      </div>

      <CompanySelector
        open={showCompanySelector}
        onOpenChange={setShowCompanySelector}
        onCompanySelected={() => setShowCompanySelector(false)}
        showInDialog={true}
      />
    </>
  )
}
