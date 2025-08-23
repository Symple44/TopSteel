'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type ColumnConfig,
  AdvancedDataTable as DataTable,
} from '@erp/ui'
import {
  AlertCircle,
  Copy,
  Edit,
  Eye,
  Package2,
  Plus,
  Trash2,
  TrendingUp,
  Upload,
  Warehouse,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { ArticleFormDialog } from '@/components/articles/article-form-dialog'
import { DuplicateArticleDialog } from '@/components/articles/duplicate-article-dialog'
import { InventoryDialog } from '@/components/articles/inventory-dialog'
import {
  type Article,
  type ArticleFilters,
  ArticleStatus,
  ArticleType,
  useArticleStatistics,
  useArticles,
  useDeleteArticle,
} from '@/hooks/use-articles'
import { cn, formatCurrency } from '@/lib/utils'

export default function ArticlesPage() {
  const router = useRouter()
  const [filters, _setFilters] = useState<ArticleFilters>({})
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  const { data: articles = [], isLoading, error } = useArticles(filters)
  const { data: statistics } = useArticleStatistics()
  const deleteArticle = useDeleteArticle()

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
        deleteArticle.mutate(id)
      }
    },
    [deleteArticle]
  )

  const handleEdit = useCallback((article: Article) => {
    setSelectedArticle(article)
    setFormMode('edit')
    setShowArticleForm(true)
  }, [])

  const handleView = useCallback(
    (article: Article) => {
      router.push(`/inventory/articles/${article.id}`)
    },
    [router]
  )

  const handleDuplicate = useCallback((article: Article) => {
    setSelectedArticle(article)
    setShowDuplicateDialog(true)
  }, [])

  const handleInventory = useCallback((article: Article) => {
    setSelectedArticle(article)
    setShowInventoryDialog(true)
  }, [])

  const typeLabels = {
    [ArticleType.MATIERE_PREMIERE]: 'Matière première',
    [ArticleType.PRODUIT_FINI]: 'Produit fini',
    [ArticleType.PRODUIT_SEMI_FINI]: 'Produit semi-fini',
    [ArticleType.FOURNITURE]: 'Fourniture',
    [ArticleType.CONSOMMABLE]: 'Consommable',
    [ArticleType.SERVICE]: 'Service',
  }

  const typeColors = {
    [ArticleType.MATIERE_PREMIERE]: 'bg-blue-100 text-blue-800',
    [ArticleType.PRODUIT_FINI]: 'bg-green-100 text-green-800',
    [ArticleType.PRODUIT_SEMI_FINI]: 'bg-orange-100 text-orange-800',
    [ArticleType.FOURNITURE]: 'bg-purple-100 text-purple-800',
    [ArticleType.CONSOMMABLE]: 'bg-yellow-100 text-yellow-800',
    [ArticleType.SERVICE]: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    [ArticleStatus.ACTIF]: 'Actif',
    [ArticleStatus.INACTIF]: 'Inactif',
    [ArticleStatus.OBSOLETE]: 'Obsolète',
    [ArticleStatus.EN_COURS_CREATION]: 'En cours de création',
  }

  const statusColors = {
    [ArticleStatus.ACTIF]: 'bg-green-100 text-green-800',
    [ArticleStatus.INACTIF]: 'bg-gray-100 text-gray-800',
    [ArticleStatus.OBSOLETE]: 'bg-red-100 text-red-800',
    [ArticleStatus.EN_COURS_CREATION]: 'bg-yellow-100 text-yellow-800',
  }

  const columns = useMemo<ColumnConfig<Article>[]>(
    () => [
      {
        id: 'reference',
        key: 'reference',
        title: 'Référence',
        description: "Code référence unique de l'article",
        type: 'text',
        sortable: true,
        searchable: true,
        width: 150,
        locked: true,
        render: (_value, article) => <div className="font-medium">{article.reference}</div>,
      },
      {
        id: 'designation',
        key: 'designation',
        title: 'Désignation',
        description: "Nom et description de l'article",
        type: 'text',
        sortable: true,
        searchable: true,
        width: 300,
        render: (_value, article) => (
          <div className="max-w-[300px]">
            <div className="font-medium truncate">{article.designation}</div>
            {article.description && (
              <div className="text-sm text-muted-foreground truncate mt-1">
                {article.description}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'type',
        key: 'type',
        title: 'Type',
        description: "Type d'article",
        type: 'select',
        sortable: true,
        searchable: true,
        width: 150,
        options: Object.entries(ArticleType).map(([_key, value]) => ({
          value: value,
          label: typeLabels[value],
        })),
        render: (_value, article) => (
          <Badge className={cn('text-xs', typeColors[article.type])}>
            {typeLabels[article.type]}
          </Badge>
        ),
      },
      {
        id: 'famille',
        key: 'famille',
        title: 'Famille',
        description: "Famille d'articles",
        type: 'text',
        sortable: true,
        searchable: true,
        width: 150,
        render: (value) => <span>{String(value || '-')}</span>,
      },
      {
        id: 'status',
        key: 'status',
        title: 'Statut',
        description: "Statut de l'article",
        type: 'select',
        sortable: true,
        searchable: true,
        width: 130,
        options: Object.entries(ArticleStatus).map(([_key, value]) => ({
          value: value,
          label: statusLabels[value],
        })),
        render: (_value, article) => (
          <Badge className={cn('text-xs', statusColors[article.status])}>
            {statusLabels[article.status]}
          </Badge>
        ),
      },
      {
        id: 'stockPhysique',
        key: 'stockPhysique',
        title: 'Stock',
        description: 'Stock physique disponible',
        type: 'number',
        sortable: true,
        width: 120,
        format: {
          decimals: 2,
        },
        render: (_value, article) => {
          if (!article.gereEnStock) {
            return <span className="text-muted-foreground">Non géré</span>
          }

          const stock = Number(article.stockPhysique || 0)
          const stockMini = Number(article.stockMini || 0)

          let className = ''
          if (stock === 0) {
            className = 'text-red-600 font-medium'
          } else if (stock <= stockMini) {
            className = 'text-orange-600 font-medium'
          }

          return (
            <div className={className}>
              {stock.toFixed(2)} {article.uniteStock}
              {stock <= stockMini && stock > 0 && (
                <AlertCircle className="inline-block ml-1 h-4 w-4" />
              )}
            </div>
          )
        },
      },
      {
        id: 'prixVenteHT',
        key: 'prixVenteHT',
        title: 'Prix HT',
        description: 'Prix de vente hors taxes',
        type: 'number',
        sortable: true,
        width: 120,
        format: {
          currency: 'EUR',
          decimals: 2,
        },
        render: (_value, article) => {
          const prix = Number(article.prixVenteHT || 0)
          return prix ? formatCurrency(prix) : '-'
        },
      },
      {
        id: 'actions',
        key: 'actions',
        title: 'Actions',
        description: 'Actions disponibles',
        type: 'custom',
        width: 200,
        locked: true,
        render: (_value, article) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleView(article)} title="Voir">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(article)} title="Modifier">
              <Edit className="h-4 w-4" />
            </Button>
            {article.gereEnStock && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleInventory(article)}
                title="Inventaire"
              >
                <Warehouse className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDuplicate(article)}
              title="Dupliquer"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(article.id)}
              className="text-red-600 hover:text-red-900"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [
      handleDelete,
      handleEdit,
      handleView,
      handleDuplicate,
      handleInventory,
      statusColors,
      statusLabels,
      typeColors,
      typeLabels,
    ]
  )

  // Actions globales pour le DataTable
  const _handleExport = useCallback(
    async (format: 'csv' | 'excel' | 'pdf') => {
      try {
        const response = await fetch('/api/articles/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format,
            filters,
            articles: articles.map((a) => ({
              reference: a.reference,
              designation: a.designation,
              type: typeLabels[a.type],
              famille: a.famille || '-',
              status: statusLabels[a.status],
              stockPhysique: a.gereEnStock ? `${a.stockPhysique} ${a.uniteStock}` : 'Non géré',
              prixVenteHT: a.prixVenteHT || 0,
            })),
          }),
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `articles_${new Date().toISOString().split('T')[0]}.${format}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }
      } catch (_error) {}
    },
    [articles, filters, statusLabels, typeLabels]
  )

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/articles/import', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          window.location.reload()
        }
      } catch (_error) {}
    }
    input.click()
  }, [])

  const handleCreate = useCallback(() => {
    setSelectedArticle(null)
    setFormMode('create')
    setShowArticleForm(true)
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Erreur de chargement</p>
          <p className="text-muted-foreground">
            Impossible de charger les articles. Veuillez réessayer.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue d'articles et suivez les stocks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalArticles}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.articlesGeresEnStock} gérés en stock
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(statistics.valeurTotaleStock)}
              </div>
              <p className="text-xs text-muted-foreground">Valorisation totale</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.articlesEnRupture}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.articlesSousStockMini} sous stock mini
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Obsolètes</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.articlesObsoletes}
              </div>
              <p className="text-xs text-muted-foreground">À réviser</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DataTable avec toutes les fonctionnalités */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={articles}
            columns={columns}
            keyField="id"
            tableId="articles-table"
            userId={
              typeof window !== 'undefined'
                ? localStorage.getItem('userId') || 'default-user'
                : 'default-user'
            }
            // Fonctionnalités supportées
            sortable={true}
            searchable={true}
            filterable={true}
            selectable={true}
            editable={false} // On gère l'édition via les dialogs
            // Pagination
            pagination={{
              page: 1,
              pageSize: 25,
              total: articles.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            // État
            loading={isLoading}
            error={error}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ArticleFormDialog
        open={showArticleForm}
        onOpenChange={setShowArticleForm}
        article={selectedArticle}
        mode={formMode}
      />

      <InventoryDialog
        open={showInventoryDialog}
        onOpenChange={setShowInventoryDialog}
        article={selectedArticle}
      />

      <DuplicateArticleDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        article={selectedArticle}
      />
    </div>
  )
}
