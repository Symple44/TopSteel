import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

// ✅ Métadonnées séparées selon Next.js 15
export const metadata: Metadata = {
  title: 'Mouvements de Stock - TopSteel ERP',
  description: 'Historique et suivi des entrées/sorties de stock',
  keywords: ['stock', 'mouvement', 'entrée', 'sortie', 'transfert', 'TopSteel'],
}

// ✅ Viewport séparé selon Next.js 15
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

interface MouvementsLayoutProps {
  children: ReactNode
}

export default function MouvementsLayout({ children }: MouvementsLayoutProps) {
  return <>{children}</>
}