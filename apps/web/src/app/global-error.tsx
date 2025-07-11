/**
 * Page Global Error - TopSteel ERP
 * Fichier: apps/web/src/app/global-error.tsx
 */

'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-destructive">Erreur</h1>
              <h2 className="text-2xl font-semibold">Une erreur est survenue</h2>
              <p className="text-muted-foreground max-w-md">
                Une erreur inattendue s'est produite. Veuillez réessayer.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Réessayer
              </button>

              <div className="text-sm text-muted-foreground">
                <a href="/dashboard" className="hover:text-foreground transition-colors">
                  Retour au tableau de bord
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
