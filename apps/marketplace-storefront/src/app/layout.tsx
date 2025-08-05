import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/query-provider'
import { TenantProvider } from '@/components/providers/tenant-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'TopSteel Marketplace',
  description: 'Boutique en ligne TopSteel - Produits métallurgiques de qualité',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TenantProvider>{children}</TenantProvider>
          </QueryProvider>
          <Toaster richColors position="top-right" expand={false} duration={4000} />
        </ThemeProvider>
      </body>
    </html>
  )
}
