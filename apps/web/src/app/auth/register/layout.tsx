import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'

// ===== MÉTADONNÉES =====
export const metadata: Metadata = {
  title: 'Inscription - TopSteel ERP',
  description: 'Créez votre compte TopSteel ERP gratuitement',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Inscription - TopSteel ERP',
    description: 'Créez votre compte TopSteel ERP gratuitement',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/register` : undefined,
  },
  twitter: {
    card: 'summary',
    title: 'Inscription - TopSteel ERP',
    description: 'Créez votre compte TopSteel ERP gratuitement',
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/register` : undefined,
  },
}

// ===== VIEWPORT SÉPARÉ =====
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

interface RegisterLayoutProps {
  children: ReactNode
}

export default function RegisterLayout({ children }: RegisterLayoutProps) {
  return (
    <div className="register-layout min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
