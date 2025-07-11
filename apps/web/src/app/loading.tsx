/**
 * Page Loading - TopSteel ERP
 * Fichier: apps/web/src/app/loading.tsx
 */

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  )
}
