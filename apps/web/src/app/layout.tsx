// apps/web/src/app/layout.tsx - ARCHITECTURE COMPLEXE PRESERVEE
import { HydrationProvider } from '@/components/providers/hydration-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TopSteel ERP',
  description: 'Système de gestion intégré pour TopSteel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Script thème initial pour éviter flash */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('erp-theme') || 'system';
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <HydrationProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </HydrationProvider>
      </body>
    </html>
  )
}
