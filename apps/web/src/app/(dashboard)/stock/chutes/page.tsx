/**
 * Page Stock Chutes Corrigée - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/stock/chutes/page.tsx
 */

'use client'

import { ClientOnly } from '@/components/client-only'

function ChutesContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Chutes</h1>
        <p className="text-muted-foreground mt-2">
          Optimisation et valorisation des chutes de matériaux
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-dashed border-border rounded-lg">
          <h3 className="font-semibold mb-2">Inventaire Chutes</h3>
          <p className="text-sm text-muted-foreground">
            Suivi des chutes disponibles
          </p>
        </div>
        
        <div className="p-6 border border-dashed border-border rounded-lg">
          <h3 className="font-semibold mb-2">Optimisation</h3>
          <p className="text-sm text-muted-foreground">
            Algorithme de découpe optimale
          </p>
        </div>
        
        <div className="p-6 border border-dashed border-border rounded-lg">
          <h3 className="font-semibold mb-2">Valorisation</h3>
          <p className="text-sm text-muted-foreground">
            Réutilisation des chutes
          </p>
        </div>
      </div>
      
      <div className="p-6 border border-dashed border-border rounded-lg">
        <p className="text-center text-muted-foreground">
          Module de gestion des chutes en cours de développement
        </p>
      </div>
    </div>
  )
}

export default function ChutesPage() {
  return (
    <ClientOnly fallback={
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    }>
      <ChutesContent />
    </ClientOnly>
  )
}