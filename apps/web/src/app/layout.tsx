import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

// ===== MÉTADONNÉES =====
export const metadata: Metadata = {
  title: {
    default: 'TopSteel ERP - Gestion Métallurgique',
    template: '%s | TopSteel ERP'
  },
  description: 'Système ERP spécialisé pour la métallurgie - Gestion complète de production, stock, clients et facturation',
  keywords: [
    'ERP',
    'métallurgie', 
    'gestion production',
    'TopSteel',
    'acier',
    'fabrication',
    'industrie'
  ],
  authors: [{ name: 'TopSteel' }],
  creator: 'TopSteel',
  publisher: 'TopSteel',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'TopSteel ERP',
    title: 'TopSteel ERP - Gestion Métallurgique',
    description: 'Système ERP spécialisé pour la métallurgie',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TopSteel ERP',
    description: 'Système ERP spécialisé pour la métallurgie',
    creator: '@topsteel_erp',
  },
  robots: {
    index: false,
    follow: false,
  },
}

// ===== VIEWPORT SÉPARÉ (Next.js 15+) =====
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
  colorScheme: 'light dark'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
