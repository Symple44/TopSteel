/**
 * 📊 LAYOUT FACTURATION PAIEMENTS - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/facturation/paiements/layout.tsx
 */

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

// ===== MÉTADONNÉES SÉPARÉES (Next.js 15) =====

export const metadata: Metadata = {
  title: {
    default: 'Gestion des Paiements',
    template: '%s | Paiements | TopSteel ERP'
  },
  description: 'Gestion et suivi des paiements clients - Facturation TopSteel ERP',
  keywords: [
    'paiements', 
    'facturation', 
    'encaissements', 
    'trésorerie',
    'comptabilité',
    'TopSteel',
    'ERP'
  ],
  robots: {
    index: false,
    follow: false
  }
}

// ===== VIEWPORT SÉPARÉ (Next.js 15) =====

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

// ===== TYPES =====
interface PaiementsLayoutProps {
  children: ReactNode
}

// ===== COMPOSANT LAYOUT =====

export default function PaiementsLayout({ children }: PaiementsLayoutProps) {
  return (
    <div className="paiements-layout">
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
                Paiements
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <main role="main" className="paiements-content">
        {children}
      </main>
    </div>
  )
}

// ===== CONFIGURATION =====
export const _dynamic = 'force-dynamic'
export const _revalidate = 60
