// apps/web/src/app/(dashboard)/projets/page.tsx - VERSION DEFENSIVE
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { ProjetCard } from "@/components/ui/projet-card"
import { formatCurrency, formatDate } from '@/lib/utils'
import { useProjets } from '@/hooks/use-projets'
import { useUI } from '@/stores'
import type { Projet } from '@erp/types'
import { Grid, List, Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useCallback, memo, useState } from 'react'

// Composant mémorisé pour les cartes
const MemoProjetCard = memo(ProjetCard, (prev, next) => 
  prev.projet?.id === next.projet?.id && 
  prev.projet?.statut === next.projet?.statut &&
  prev.projet?.avancement === next.projet?.avancement
)

// Composant mémorisé pour les actions
const PageActions = memo(({ view, onViewChange, onRefresh, isLoading }: {
  view: 'grid' | 'table'
  onViewChange: (view: 'grid' | 'table') => void
  onRefresh: () => void
  isLoading: boolean
}) => (
  <div className="flex items-center space-x-2">
    <div className="flex rounded-md border">
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="border-r"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onRefresh}
      disabled={isLoading}
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
    </Button>
    <Button asChild>
      <Link href="/projets/nouveau">
        <Plus className="h-4 w-4 mr-2" />
        Nouveau projet
      </Link>
    </Button>
  </div>
))

export default function ProjetsPage() {
  const { projets = [], isLoading, refetch } = useProjets() // Défaut sûr
  const { dataView, setDataView } = useUI()
  const [searchTerm, setSearchTerm] = useState('')

  // Recherche avec protection undefined
  const filteredProjets = useMemo(() => {
    if (!projets || !Array.isArray(projets)) return []
    
    if (!searchTerm) return projets
    
    const searchLower = searchTerm.toLowerCase()
    return projets.filter((projet) => {
      if (!projet) return false
      
      const reference = projet.reference || ''
      const nom = projet.nom || ''
      const clientNom = projet.client?.nom || ''
      
      return (
        reference.toLowerCase().includes(searchLower) ||
        nom.toLowerCase().includes(searchLower) ||
        clientNom.toLowerCase().includes(searchLower)
      )
    })
  }, [projets, searchTerm])

  // Colonnes mémorisées avec protection
  const columns = useMemo(() => [
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
    },
    {
      key: 'client',
      label: 'Client',
      render: (_: any, projet: Projet) => projet?.client?.nom || 'Client non défini',
      sortable: true,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (statut: string) => (
        <Badge variant="outline">{statut || 'N/A'}</Badge>
      ),
      sortable: true,
    },
    {
      key: 'montantHT',
      label: 'Montant HT',
      render: (montant: number) => formatCurrency(montant || 0),
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
      render: (avancement: number) => `${avancement || 0}%`,
      sortable: true,
    },
  ], [])

  // Handlers stables
  const handleViewChange = useCallback((view: 'grid' | 'table') => {
    setDataView(view)
  }, [setDataView])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Loading state avec protection
  if (isLoading && (!projets || projets.length === 0)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-current border-r-transparent gpu-accelerated" />
          <p className="mt-4 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets"
        subtitle={`${filteredProjets?.length || 0} projet(s)`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projets' },
        ]}
        actions={
          <PageActions
            view={dataView}
            onViewChange={handleViewChange}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />
        }
      />

      {/* Barre de recherche */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Rechercher un projet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
      </div>

      {/* Contenu avec protection */}
      {dataView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjets && filteredProjets.length > 0 ? (
            filteredProjets.map((projet) => (
              projet ? <MemoProjetCard key={projet.id} projet={projet} /> : null
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              Aucun projet trouvé
            </div>
          )}
        </div>
      ) : (
        <DataTable
          data={filteredProjets || []}
          columns={columns}
          loading={isLoading}
        />
      )}
    </div>
  )
}


