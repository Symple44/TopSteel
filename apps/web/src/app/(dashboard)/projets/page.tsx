'use client'

import { useDataView } from '@/hooks/use-data-view'
import { useProjets } from '@/hooks/use-projets'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Projet } from '@erp/types'
import { Badge, Button, Card, CardContent, DataTable, Input, PageHeader, ProjetCard } from '@erp/ui'
import { Eye, FolderOpen, Grid, List, Plus, RefreshCw, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useCallback, useMemo, useState } from 'react'

// Composant PageActions avec displayName
const PageActions = memo(function PageActions({
  view,
  onViewChange,
  onRefresh,
  isLoading,
}: {
  view: 'grid' | 'table'
  onViewChange: (view: 'grid' | 'table') => void
  onRefresh: () => void
  isLoading: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Bouton Nouveau projet */}
      <Link href="/projets/nouveau">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </Link>

      {/* Toggle vue */}
      <div className="flex border rounded-md">
        <Button
          variant={view === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('grid')}
          className="rounded-r-none border-r"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('table')}
          className="rounded-l-none"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Bouton Actualiser */}
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
})

// Composant ProjetCard mémorisé
const MemoProjetCard = memo(function MemoProjetCard({ projet }: { projet: Projet }) {
  return <ProjetCard projet={projet} />
})

export default function ProjetsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const { dataView, setDataView } = useDataView('grid')

  // Hook projets avec gestion d'erreur
  const { projets = [], isLoading, error, refetch } = useProjets()

  // Filtrage des projets
  const filteredProjets = useMemo(() => {
    if (!Array.isArray(projets)) return []
    if (!searchTerm.trim()) return projets

    const term = searchTerm.toLowerCase()

    return projets.filter(
      (projet) =>
        projet?.reference?.toLowerCase().includes(term) ||
        projet?.client?.nom?.toLowerCase().includes(term) ||
        projet?.reference?.toLowerCase().includes(term) ||
        projet?.description?.toLowerCase().includes(term)
    )
  }, [projets, searchTerm])

  // Colonnes pour le tableau
  const columns = useMemo(
    () => [
      {
        key: 'reference',
        label: 'Référence',
        render: (reference: string, projet: Projet) => (
          <div>
            <div className="font-medium">{reference || 'Sans référence'}</div>
            <div className="text-sm text-gray-500">{projet.reference || 'Sans référence'}</div>
          </div>
        ),
        sortable: true,
      },
      {
        key: 'client',
        label: 'Client',
        render: (client: unknown) => client?.nom || '-',
        sortable: true,
      },
      {
        key: 'statut',
        label: 'Statut',
        render: (statut: string) => <Badge variant="outline">{statut || 'Non défini'}</Badge>,
        sortable: true,
      },
      {
        key: 'montantHT',
        label: 'Montant HT',
        render: (montant: number) => (montant ? formatCurrency(montant) : '-'),
        sortable: true,
      },
      {
        key: 'dateDebut',
        label: 'Date début',
        render: (date: string) => (date ? formatDate(date) : '-'),
        sortable: true,
      },
      {
        key: 'avancement',
        label: 'Avancement',
        render: (avancement: number) => `${avancement || 0}%`,
        sortable: true,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (value: unknown, projet: Projet) => (
          <div className="flex gap-1">
            <Button variant="ghost"
              size="sm"
              onClick={() => router.push(`/projets/${projet.id}`)}
              aria-label={`Voir le projet ${projet.reference}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost"
              size="sm"
              onClick={() => router.push(`/projets/${projet.id}/edit`)}
              aria-label={`Modifier le projet ${projet.reference}`}
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  )

  // Handlers avec dépendances correctes
  const handleViewChange = useCallback(
    (view: 'grid' | 'table') => {
      setDataView(view)
    },
    [setDataView]
  )

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  // Loading state
  if (isLoading && (!projets || projets.length === 0)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-current border-r-transparent" />
          <p className="mt-4 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Erreur lors du chargement</p>
          <p className="text-gray-600">Impossible de charger les projets</p>
          <Button onClick={handleRefresh} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets"
        subtitle={`${filteredProjets.length} projet(s)`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Projets' }]}
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
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un projet, client, référence..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {dataView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjets.length > 0 ? (
            filteredProjets.map((projet) =>
              projet?.id ? <MemoProjetCard key={projet.id} projet={projet} /> : null
            )
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Aucun projet trouvé' : 'Aucun projet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? 'Aucun projet ne correspond à votre recherche'
                      : 'Commencez par créer votre premier projet'}
                  </p>
                  {!searchTerm && (
                    <Link href="/projets/nouveau">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer un projet
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              data={filteredProjets}
              columns={columns}
              searchableColumns={['nom', 'reference', 'description']}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
