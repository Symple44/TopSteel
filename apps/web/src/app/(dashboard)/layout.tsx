'use client'

/**
 * Layout Dashboard - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/layout.tsx
 * CORRIGÉ - Ne redéfinit plus HTML/BODY
 */

import type { ReactNode } from 'react'
import { AuthGuard } from '../../components/auth/auth-guard'
import { DashboardContent } from '../../components/layout/dashboard-content'
import { ConnectionProvider } from '../../contexts/connection-context'
import { useAuth } from '../../hooks/use-auth'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { requiresCompanySelection, company } = useAuth()

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
