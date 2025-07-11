/**
 * Page Nouveau Projet Corrigée - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/projets/nouveau/page.tsx
 */

'use client'

import { ClientOnly } from '@/components/client-only'

function NouveauProjetContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Nouveau projet</h1>
        <p className="text-muted-foreground mt-2">Créer un nouveau projet TopSteel</p>
      </div>

      <div className="p-6 border border-dashed border-border rounded-lg">
        <p className="text-center text-muted-foreground">
          Formulaire de création en cours de développement
        </p>
      </div>
    </div>
  )
}

export default function NouveauProjetPage() {
  return (
    <ClientOnly
      fallback={
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
        </div>
      }
    >
      <NouveauProjetContent />
    </ClientOnly>
  )
}
