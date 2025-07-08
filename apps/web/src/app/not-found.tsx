/**
 * Page Not Found - TopSteel ERP
 * Fichier: apps/web/src/app/not-found.tsx
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">Page non trouvée</h2>
          <p className="text-muted-foreground max-w-md">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retour au tableau de bord
          </Link>

          <div className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}




