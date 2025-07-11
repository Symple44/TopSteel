import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

// ===== MÉTADONNÉES SÉPARÉES (Next.js 15) =====

export const metadata: Metadata = {
  title: {
    default: 'Inscription - TopSteel ERP',
    template: '%s | TopSteel ERP',
  },
  description:
    'Créez votre compte TopSteel ERP pour gérer votre entreprise efficacement. Inscription gratuite et sécurisée.',
  keywords: [
    'inscription',
    'création compte',
    'TopSteel',
    'ERP',
    'gestion entreprise',
    'registration',
    'signup',
  ],
  authors: [{ name: 'TopSteel' }],
  creator: 'TopSteel ERP',
  publisher: 'TopSteel',
  category: 'business',

  // Optimisations SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph pour les partages
  openGraph: {
    type: 'website',
    siteName: 'TopSteel ERP',
    title: 'Inscription - TopSteel ERP',
    description: 'Créez votre compte TopSteel ERP gratuitement',
    locale: 'fr_FR',
    url: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/register`
      : undefined,
  },

  // Twitter Card
  twitter: {
    card: 'summary',
    title: 'Inscription - TopSteel ERP',
    description: 'Créez votre compte TopSteel ERP gratuitement',
    creator: '@topsteel_erp',
  },

  // Canonical URL pour éviter le contenu dupliqué
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/register`
      : undefined,
    languages: {
      'fr-FR': process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/register`
        : undefined,
    },
  },

  // Métadonnées d'application
  applicationName: 'TopSteel ERP',

  // Pas de cache pour la page d'inscription
  other: {
    'cache-control': 'no-cache, no-store, must-revalidate',
  },
}

// ===== VIEWPORT SÉPARÉ (Next.js 15) =====

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Empêche le zoom pour une expérience app-like
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
}

// ===== TYPES =====

interface RegisterLayoutProps {
  children: ReactNode
}

// ===== COMPOSANT LAYOUT =====

export default function RegisterLayout({ children }: RegisterLayoutProps) {
  return (
    <div className="register-layout min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Inscription TopSteel ERP',
            description: 'Créez votre compte TopSteel ERP pour gérer votre entreprise',
            url: process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/register`
              : undefined,
            isPartOf: {
              '@type': 'WebSite',
              name: 'TopSteel ERP',
              url: process.env.NEXT_PUBLIC_APP_URL || '',
            },
            inLanguage: 'fr-FR',
            potentialAction: {
              '@type': 'RegisterAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: process.env.NEXT_PUBLIC_APP_URL
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/register`
                  : undefined,
              },
            },
          }),
        }}
      />

      {}
      <header className="sr-only">
        <h1>Inscription TopSteel ERP</h1>
      </header>

      {}
      <main className="register-content" id="main-content">
        {children}
      </main>

      {}
      <footer className="text-center py-4 text-sm text-gray-500 border-t">
        <div className="container mx-auto px-4">
          <p>
            © {new Date().getFullYear()} TopSteel ERP. Tous droits réservés.{' '}
            <a
              href="/privacy"
              className="text-blue-600 hover:text-blue-500 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Confidentialité
            </a>
            {' · '}
            <a
              href="/terms"
              className="text-blue-600 hover:text-blue-500 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conditions
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

// ===== CONFIGURATION =====

// Force le rendu dynamique pour éviter les problèmes de prerendering
export const dynamic = 'force-dynamic'

// Pas de cache pour cette page
export const revalidate = 0

// Configuration runtime pour optimiser les performances
export const runtime = 'nodejs'

// Segment config pour optimiser le bundle
export const preferredRegion = 'auto'

