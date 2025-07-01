import { Providers } from '@/components/providers'
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'TopSteel - ERP Métallurgie Moderne',
  description: 'Solution ERP nouvelle génération pour les entreprises de construction métallique et métallurgie',
  keywords: 'ERP, construction métallique, métallerie, ferronnerie, gestion moderne, production digitale, stocks intelligents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} bg-background text-foreground antialiased font-feature-settings-liga font-feature-settings-calt`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
