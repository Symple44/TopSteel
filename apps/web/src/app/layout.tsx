// apps/web/src/app/layout.tsx - ROOT LAYOUT COMPLET
import { HydrationProvider } from '@/components/providers/hydration-provider'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TopSteel ERP',
  description: 'Système de gestion intégré pour TopSteel',
}

/**
 * ✅ Root Layout avec HydrationProvider pour éviter erreurs SSR
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* ✅ CRITIQUE: HydrationProvider doit wrapper tout le contenu */}
        <HydrationProvider>
          {children}
        </HydrationProvider>
        
        {/* Scripts additionnels si nécessaire */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Éviter les flashes de thème
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </body>
    </html>
  )
}