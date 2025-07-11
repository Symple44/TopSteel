/**
 * 📦 LAYOUT MOUVEMENTS STOCK - TopSteel ERP
 * Layout conforme aux standards Next.js 15
 * Fichier: apps/web/src/app/(dashboard)/stock/mouvements/layout.tsx
 */

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

// ===== MÉTADONNÉES SÉPARÉES (Next.js 15) =====

export const metadata: Metadata = {
  title: {
    default: 'Mouvements de Stock',
    template: '%s | Mouvements de Stock | TopSteel ERP',
  },
  description:
    "Historique et suivi des entrées/sorties de stock - Gestion des mouvements d'inventaire TopSteel",
  keywords: [
    'stock',
    'mouvement',
    'entrée',
    'sortie',
    'transfert',
    'inventaire',
    'TopSteel',
    'ERP',
    'gestion',
  ],
  authors: [{ name: 'TopSteel' }],
  creator: 'TopSteel ERP',
  publisher: 'TopSteel',
  category: 'business',
  robots: {
    index: false, // Pages internes, pas d'indexation
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'TopSteel ERP',
    title: 'Mouvements de Stock',
    description: 'Gestion des mouvements de stock et inventaire',
    locale: 'fr_FR',
  },
}

// ===== VIEWPORT SÉPARÉ (Next.js 15) =====

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Empêche le zoom sur mobile pour une expérience app-like
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
}

// ===== TYPES =====
interface MouvementsLayoutProps {
  children: ReactNode
}

// ===== COMPOSANT LAYOUT =====

/**
 * Layout pour la section mouvements de stock
 * Optimisé pour les performances et la robustesse
 */
export default function MouvementsLayout({ children }: MouvementsLayoutProps) {
  return (
    <div className="mouvements-layout">
      {/* Breadcrumb et navigation contextuelle */}
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
                Mouvements
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Contenu principal */}
      <main role="main" className="mouvements-content">
        {children}
      </main>

      {/* Scripts et optimisations spécifiques à cette section */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'TopSteel ERP - Mouvements de Stock',
            description: 'Module de gestion des mouvements de stock',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            applicationSubCategory: 'ERP',
          }),
        }}
      />
    </div>
  )
}

// ===== CONFIGURATION AVANCÉE (Optionnel) =====

/**
 * Configuration pour le streaming et la génération statique
 */
export const dynamic = 'force-dynamic' // Pages toujours dynamiques pour les données temps réel
export const revalidate = 60 // Revalidation toutes les 60 secondes
export const fetchCache = 'force-no-store' // Pas de cache pour les données fraîches

/**
 * Configuration du runtime
 */
export const runtime = 'nodejs' // Runtime par défaut pour la compatibilité maximale

/**
 * Gestion des erreurs au niveau layout
 */
// ===== STYLES SPÉCIFIQUES =====

/**
 * Injection de styles CSS spécifiques à la section mouvements
 * (Optionnel - peut être géré via Tailwind ou CSS modules)
 */
const styles = `
  .mouvements-layout {
    container-type: inline-size;
    min-height: calc(100vh - var(--header-height, 60px));
  }

  .mouvements-content {
    container-type: inline-size;
  }

  /* Optimisations pour les graphiques */
  @container (max-width: 768px) {
    .mouvements-content [data-chart] {
      height: 250px;
    }
  }

  @container (min-width: 769px) {
    .mouvements-content [data-chart] {
      height: 350px;
    }
  }

  /* Optimisations pour les tableaux */
  @container (max-width: 640px) {
    .mouvements-content table {
      font-size: 0.875rem;
    }
  }

  /* Loading states */
  .mouvements-content [data-client-only="loading"] {
    opacity: 0.7;
    pointer-events: none;
  }

  .mouvements-content [data-client-only="mounted"] {
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

// ===== EXPORTS COMPLÉMENTAIRES =====

/**
 * Configuration pour les pages enfants
 */
export const generateStaticParams = async () => {
  // Pas de params statiques pour cette section
  return []
}
