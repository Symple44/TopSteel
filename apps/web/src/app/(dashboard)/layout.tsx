'use client'

/**
 * Layout Dashboard - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/layout.tsx
 * CORRIGÉ - Ne redéfinit plus HTML/BODY
 */

import { AuthGuard } from '@/components/auth/auth-guard'
import { ConnectionProvider } from '@/contexts/connection-context'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { useAuth } from '@/hooks/use-auth'
import type { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { requiresCompanySelection, company } = useAuth()

  return (
    <ConnectionProvider>
      <AuthGuard>
        <DashboardContent 
          requiresCompanySelection={requiresCompanySelection}
          company={company}
        >
          {children}
        </DashboardContent>
      </AuthGuard>
    </ConnectionProvider>
  )
}
