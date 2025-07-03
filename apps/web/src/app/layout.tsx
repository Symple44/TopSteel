import { ThemeProvider } from '@/components/providers/theme-provider'
import { Inter } from 'next/font/google'
import './globals.css'
import { useWebVitalsMonitoring } from '@/hooks/performance/use-performance'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TopSteel ERP',
  description: 'Système de gestion intégré pour TopSteel',
}

{
  useWebVitalsMonitoring()
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className} suppressHydrationWarning>
      <body>
        <ThemeProvider
          defaultTheme="system"
          storageKey="topsteel-theme"
          enableSystemWatch={true}
          enableMetrics={true}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
