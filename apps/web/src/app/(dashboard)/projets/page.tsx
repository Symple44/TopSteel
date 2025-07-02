// apps/web/src/app/(dashboard)/projets/page.tsx - VERSION CORRIGÉE
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { ProjetCard } from "@/components/ui/projet-card"
import { formatCurrency, formatDate } from '@/lib/utils'
import { useProjets, useUI } from '@/stores'
import type { Projet } from '@erp/types'
import { Grid, List, Plus } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'

export default function ProjetsPage() {
  const { projets, isLoading, fetchProjets, refetchWithFilters } = useProjets()
  const { dataView, setDataView } = useUI()

  // ✅ FIX: Stabilisation des handlers avec useCallback
  const handleViewChange = useCallback((view: 'grid' | 'table') => {
    setDataView(view) // ✅ FIX CRITIQUE: Correction typo setdataView → setDataView
  }, [setDataView])

  const handleRefresh = useCallback(() => {
    refetchWithFilters()
  }, [refetchWithFilters])

  // ✅ Mémorisation des colonnes pour éviter les re-renders
  const columns = useMemo(() => [
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
  ], [])

  // ✅ Loading state stable
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
                variant={dataView === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('grid')} // ✅ Handler stable
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={dataView === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('table')} // ✅ Handler stable
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              size="sm"
            >
              Actualiser
            </Button>
            <Button asChild>
              <Link href="/projets/nouveau">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau projet
              </Link>
            </Button>
          </div>
        }
      />

      {dataView === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projets.map((projet) => (
            <ProjetCard key={projet.id} projet={projet} />
          ))}
        </div>
      ) : (
        <DataTable
          data={projets}
          columns={columns}
          searchable
          sortable
        />
      )}
    </div>
  )
}