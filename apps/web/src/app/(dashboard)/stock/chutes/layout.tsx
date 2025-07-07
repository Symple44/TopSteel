/**
 * Layout Stock Chutes - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/stock/chutes/layout.tsx
 */

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Gestion des Chutes - TopSteel ERP',
  description: 'Optimisation et gestion des chutes de matériaux',
  keywords: ['chutes', 'stock', 'optimisation', 'matériaux', 'TopSteel'],
  robots: {
    index: false,
    follow: false
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

interface ChutesLayoutProps {
  children: ReactNode
}

export default function ChutesLayout({ children }: ChutesLayoutProps) {
  return (
    <div className="chutes-layout">
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
              <a href="/stock" className="hover:text-foreground transition-colors">
                Stock
              </a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground" aria-current="page">
                Chutes
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <main role="main" className="chutes-content">
        {children}
      </main>
    </div>
  )
}

export const _dynamic = 'force-dynamic'
