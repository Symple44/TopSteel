// apps/web/src/app/layout.tsx - VERSION COMPLÈTE AVEC MONITORING
import { MonitoringProvider } from '@/components/providers/monitoring-provider'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import '../styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: 'TopSteel ERP - Gestion Métallurgique',
    template: '%s | TopSteel ERP'
  },
  description: 'Système ERP pour la gestion métallurgique industrielle - TopSteel',
  keywords: ['ERP', 'Métallurgie', 'Gestion', 'Production', 'Projets'],
  authors: [{ name: 'TopSteel' }],
  creator: 'TopSteel',
  publisher: 'TopSteel',
  robots: {
    index: false, // Pas d'indexation pour un ERP interne
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Préchargement des polices critiques */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="TopSteel ERP" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TopSteel ERP" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2563eb" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      </head>
      <body className="font-inter antialiased bg-background text-foreground">
        {/* Providers avec monitoring intégré */}
        <Providers>
          <MonitoringProvider>
            <div id="root-app" className="relative">
              {/* Layout principal */}
              <main className="min-h-screen">
                {children}
              </main>
              
              {/* Overlay pour les modales */}
              <div id="modal-root" />
              
              {/* Toast container */}
              <div id="toast-root" />
            </div>
          </MonitoringProvider>
        </Providers>
        
        {/* Scripts de performance en développement */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Console de développement TopSteel
                console.log('%c🏭 TopSteel ERP', 'color: #2563eb; font-size: 16px; font-weight: bold;');
                console.log('%cEnvironnement: ${process.env.NODE_ENV}', 'color: #10b981;');
                console.log('%cMonitoring activé', 'color: #f59e0b;');
                
                // Performance observer pour debug
                if ('PerformanceObserver' in window) {
                  const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                      if (entry.duration > 100) {
                        console.warn('🐌 Performance warning:', entry.name, entry.duration + 'ms');
                      }
                    });
                  });
                  observer.observe({ entryTypes: ['measure', 'navigation'] });
                }
              `
            }}
          />
        )}
      </body>
    </html>
  )
}