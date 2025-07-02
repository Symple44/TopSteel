// apps/web/src/app/layout.tsx - SANS SCRIPT LOCALSTORAGE (FIX HYDRATATION)
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
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
