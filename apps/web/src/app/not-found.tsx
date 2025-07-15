/**
 * Page Not Found - TopSteel ERP
 * Fichier: apps/web/src/app/not-found.tsx
 */

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Page non trouvée</h2>
          <p className="max-w-md">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Retour au tableau de bord
          </a>

          <div className="text-sm">
            <a href="/" className="hover:underline">
              Accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
