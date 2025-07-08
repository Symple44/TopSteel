/**
 * Layout Projets Nouveau - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/projets/nouveau/layout.tsx
 */

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Nouveau Projet - TopSteel ERP',
  description: "Création d'un nouveau projet",
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

interface NouveauProjetLayoutProps {
  children: ReactNode
}

export default function NouveauProjetLayout({ children }: NouveauProjetLayoutProps) {
  return <>{children}</>
}

export const dynamic = 'force-dynamic'
