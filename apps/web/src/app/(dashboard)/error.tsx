/**
 * Page Dashboard Error - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/error.tsx
 */

'use client'

import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-destructive">Erreur</h1>
          <h2 className="text-xl font-semibold">Problème dans le dashboard</h2>
          <p className="text-muted-foreground max-w-md">
            Une erreur s'est produite lors du chargement du dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>

          <div className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}




