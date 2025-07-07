import { ThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import '@/styles/globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

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


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}