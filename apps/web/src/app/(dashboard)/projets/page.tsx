// apps/web/src/app/(dashboard)/projets/page.tsx
'use client'

import { DataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { ProjetCard } from "@/components/ui/projet-card"
import { useProjets } from '@/hooks/use-projets'
import type { Projet } from '@erp/types'
import { Badge, Button } from '@erp/ui'
import { formatCurrency, formatDate } from '@erp/utils'
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
      render: (_: any, projet: Projet) => projet.client.nom,
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
    return <div className="p-6">Chargement...</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projets.map((projet) => (
              <ProjetCard
                key={projet.id}
                projet={projet}
                onClick={() => console.log('Navigate to', projet.id)}
              />
            ))}
          </div>
        ) : (
          <DataTable
            data={projets}
            columns={columns}
            searchPlaceholder="Rechercher un projet..."
            onRowClick={(projet) => console.log('Navigate to', projet.id)}
          />
        )}
      </div>
    </div>
  )
}