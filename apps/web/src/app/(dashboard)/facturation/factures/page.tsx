/**
 * Page Facturation Factures Corrigée - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/facturation/factures/page.tsx
 */

'use client'

import { ClientOnly } from '@/components/client-only'

function FacturesContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Factures</h1>
        <p className="text-muted-foreground mt-2">
          Création, édition et suivi des factures clients
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-dashed border-border rounded-lg">
          <h3 className="font-semibold mb-2">Factures en cours</h3>
          <p className="text-sm text-muted-foreground">Factures non finalisées</p>
        </div>

        <div className="p-6 border border-dashed border-border rounded-lg">
          <h3 className="font-semibold mb-2">Factures envoyées</h3>
          <p className="text-sm text-muted-foreground">En attente de paiement</p>
        </div>

        <div className="p-6 border border-dashed border-border rounded-lg">
          <h3 className="font-semibold mb-2">Factures payées</h3>
          <p className="text-sm text-muted-foreground">Encaissements effectués</p>
        </div>
      </div>

      <div className="p-6 border border-dashed border-border rounded-lg">
        <p className="text-center text-muted-foreground">
          Module de gestion des factures en cours de développement
        </p>
      </div>
    </div>
  )
}

export default function FacturesPage() {
  return (
    <ClientOnly
      fallback={
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={`item-${i}`} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mb-2" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <FacturesContent />
    </ClientOnly>
  )
}

