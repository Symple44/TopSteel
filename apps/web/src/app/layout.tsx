import { AuthLoader, AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ERP TopSteel - Gestion métallerie',
  description: 'Système ERP complet pour les entreprises de construction métallique et métallerie',
  keywords: ['ERP', 'métallerie', 'construction métallique', 'gestion', 'TopSteel'],
  authors: [{ name: 'TopSteel' }],
  robots: 'index, follow',
  openGraph: {
    title: 'ERP TopSteel',
    description: 'Système ERP complet pour les entreprises de métallerie',
    type: 'website',
    locale: 'fr_FR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <AuthLoader>
            <div className="min-h-full">
              {children}
            </div>
          </AuthLoader>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}