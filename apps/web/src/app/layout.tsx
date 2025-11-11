import type { Metadata, Viewport } from 'next'

// Force all pages to be dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Inter, Poppins } from 'next/font/google'
import '../styles/globals.css'
import { getCSPNonce } from '../lib/security/csp-nonce'
import { Providers } from './providers'
// import { logStartupInfo } from '../lib/startup-logger'

// Tests désactivés pour réduire les logs
// import '../utils/fetch-test'
// import '../utils/menu-preferences-debug'
import '../utils/telemetry-test'

// Log startup info on server side
// if (typeof window === 'undefined') {
//   logStartupInfo()
// }

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'TopSteel ERP - Gestion Métallurgique',
    template: '%s | TopSteel ERP',
  },
  description:
    'Système ERP spécialisé pour la métallurgie - Gestion complète de production, stock, clients et facturation',
  keywords: [
    'ERP',
    'métallurgie',
    'gestion production',
    'TopSteel',
    'acier',
    'fabrication',
    'industrie',
  ],
  authors: [{ name: 'TopSteel' }],
  creator: 'TopSteel',
  publisher: 'TopSteel',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process?.env?.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'),
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Get CSP nonce from headers for client-side access
  const nonce = getCSPNonce()

  return (
    <html lang="fr" className={`${inter?.variable} ${poppins?.variable}`} suppressHydrationWarning>
      <head>
        {/* CSP Nonce meta tag for client-side access */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body
        className="font-inter antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
