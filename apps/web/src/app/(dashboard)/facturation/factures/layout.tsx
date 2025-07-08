/**
 * Layout Facturation Factures - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/facturation/factures/layout.tsx
 */

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Gestion des Factures - TopSteel ERP',
  description: 'Gestion et édition des factures clients',
  keywords: ['factures', 'facturation', 'clients', 'comptabilité', 'TopSteel'],
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

interface FacturesLayoutProps {
  children: ReactNode
}

export default function FacturesLayout({ children }: FacturesLayoutProps) {
  return (
    <div className="factures-layout">
      <div className="mb-6">
        <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/dashboard" className="hover:text-foreground transition-colors">
                Tableau de bord
              </a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <a href="/facturation" className="hover:text-foreground transition-colors">
                Facturation
              </a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground" aria-current="page">
                Factures
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <main role="main" className="factures-content">
        {children}
      </main>
    </div>
  )
}

export const dynamic = 'force-dynamic'
