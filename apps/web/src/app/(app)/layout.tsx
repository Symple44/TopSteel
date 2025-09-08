'use client'

/**
 * Layout Application - TopSteel ERP
 * Architecture modulaire nouvelle génération
 */

import type { ReactNode } from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { ConnectionProvider } from '@/contexts/connection-context'
import { useAuth } from '@/hooks/use-auth'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const authQuery = useAuth()
  const { requiresCompanySelection, company } = authQuery

  return (
    <ConnectionProvider>
      <AuthGuard>
        <DashboardContent requiresCompanySelection={requiresCompanySelection} company={company}>
          {children}
        </DashboardContent>
      </AuthGuard>
    </ConnectionProvider>
  )
}
