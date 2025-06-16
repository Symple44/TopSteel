import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ERP Métallerie',
    template: '%s | ERP Métallerie',
  },
  description: 'Système de gestion intégré pour les entreprises de métallerie',
  keywords: ['ERP', 'métallerie', 'gestion', 'production', 'stocks', 'chiffrage'],
  authors: [{ name: 'ERP Métallerie Team' }],
  creator: 'ERP Métallerie',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'ERP Métallerie',
    description: 'Système de gestion intégré pour les entreprises de métallerie',
    siteName: 'ERP Métallerie',
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}