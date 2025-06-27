// apps/web/src/app/(dashboard)/projets/page.tsx (avec asChild)
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { ProjetCard } from "@/components/ui/projet-card"
import { useProjets } from '@/hooks/use-projets'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Projet } from '@erp/types'
import { Grid, List, Plus } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export default function ProjetsPage() {
  const { data: projets = [], isLoading } = useProjets()
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid')

  const columns = [
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
    },
    {
      key: 'client',
      label: 'Client',
      render: (_: any, projet: Projet) => projet.client?.nom || 'Client non défini',
      sortable: true,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (statut: string) => (
        <Badge variant="outline">{statut}</Badge>
      ),
      sortable: true,
    },
    {
      key: 'montantHT',
      label: 'Montant HT',
      render: (montant: number) => formatCurrency(montant),
      sortable: true,
    },
    {
      key: 'dateDebut',
      label: 'Date début',
      render: (date: Date) => date ? formatDate(date) : '-',
      sortable: true,
    },
    {
      key: 'avancement',
      label: 'Avancement',
      render: (avancement: number) => `${avancement}%`,
      sortable: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets"
        subtitle={`${projets.length} projet(s)`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projets' },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* ✅ asChild avec le nouveau composant Button */}
            <Button asChild>
              <Link href="/projets/nouveau">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau projet
              </Link>
            </Button>
          </div>
        }
      />

      <div className="px-6">
        {viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projets.map((projet) => (
              <ProjetCard key={projet.id} projet={projet} />
            ))}
            {projets.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Aucun projet trouvé</p>
                {/* ✅ asChild avec le nouveau composant Button */}
                <Button asChild className="mt-4">
                  <Link href="/projets/nouveau">
                    <Plus className="h-4 w-4 mr-1" />
                    Créer le premier projet
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <DataTable
            data={projets}
            columns={columns}
            searchKey="reference"
            searchPlaceholder="Rechercher un projet..."
          />
        )}
      </div>
    </div>
  )
}