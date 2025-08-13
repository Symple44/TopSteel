'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  Calendar,
  Copy,
  DollarSign,
  Edit,
  Package2,
  Tags,
  TrendingUp,
  Warehouse,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArticleFormDialog } from '@/components/articles/article-form-dialog'
import { DuplicateArticleDialog } from '@/components/articles/duplicate-article-dialog'
import { InventoryDialog } from '@/components/articles/inventory-dialog'
import { ArticleStatus, ArticleType, useArticle } from '@/hooks/use-articles'
import { formatCurrency, formatDate } from '@/lib/utils'

const articleTypeLabels = {
  [ArticleType.MATIERE_PREMIERE]: 'Matière première',
  [ArticleType.PRODUIT_FINI]: 'Produit fini',
  [ArticleType.PRODUIT_SEMI_FINI]: 'Produit semi-fini',
  [ArticleType.FOURNITURE]: 'Fourniture',
  [ArticleType.CONSOMMABLE]: 'Consommable',
  [ArticleType.SERVICE]: 'Service',
}

const articleStatusLabels = {
  [ArticleStatus.ACTIF]: 'Actif',
  [ArticleStatus.INACTIF]: 'Inactif',
  [ArticleStatus.OBSOLETE]: 'Obsolète',
  [ArticleStatus.EN_COURS_CREATION]: 'En cours de création',
}

const getStatusColor = (status: ArticleStatus) => {
  switch (status) {
    case ArticleStatus.ACTIF:
      return 'bg-green-100 text-green-800 border-green-300'
    case ArticleStatus.INACTIF:
      return 'bg-gray-100 text-gray-800 border-gray-300'
    case ArticleStatus.OBSOLETE:
      return 'bg-red-100 text-red-800 border-red-300'
    case ArticleStatus.EN_COURS_CREATION:
      return 'bg-blue-100 text-blue-800 border-blue-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const articleId = params.id as string

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)

  const { data: article, isLoading, error } = useArticle(articleId)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Article introuvable</h3>
            <p className="text-gray-600 text-center mb-4">
              L'article demandé n'existe pas ou vous n'avez pas les permissions pour le voir.
            </p>
            <Button onClick={() => router.push('/inventory/articles')}>Retour à la liste</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stockStatus =
    Number(article.stockPhysique || 0) <= 0
      ? 'rupture'
      : article.stockMini && Number(article.stockPhysique || 0) <= Number(article.stockMini || 0)
        ? 'sous-mini'
        : 'normal'

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{article.designation}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-gray-600 text-sm">Référence: {article.reference}</span>
              <Badge className={getStatusColor(article.status)}>
                {articleStatusLabels[article.status]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowInventoryDialog(true)} className="h-8">
            <Warehouse className="h-4 w-4 mr-2" />
            Inventaire
          </Button>
          <Button variant="outline" onClick={() => setShowDuplicateDialog(true)} className="h-8">
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
          <Button onClick={() => setShowEditDialog(true)} className="h-8">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Indicateurs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock actuel</CardTitle>
            <Package2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(article.stockPhysique || 0).toFixed(2)}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  stockStatus === 'rupture'
                    ? 'bg-red-500'
                    : stockStatus === 'sous-mini'
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                }`}
              />
              <span className="text-gray-600">
                {stockStatus === 'rupture'
                  ? 'En rupture'
                  : stockStatus === 'sous-mini'
                    ? 'Sous stock mini'
                    : 'Normal'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix unitaire</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(article.prixVenteHT ?? 0)}</div>
            <p className="text-xs text-gray-600">HT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((article.stockPhysique ?? 0) * (article.prixVenteHT ?? 0))}
            </div>
            <p className="text-xs text-gray-600">Valeur totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            <Tags className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{articleTypeLabels[article.type]}</div>
            <p className="text-xs text-gray-600">{article.famille ?? 'Non classé'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Détails dans des onglets */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="pricing">Tarification</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Barcode className="h-4 w-4" />
                  <span>Informations générales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Référence</label>
                  <p className="text-sm">{article.reference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Désignation</label>
                  <p className="text-sm">{article.designation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm">{article.description || 'Aucune description'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Marque</label>
                  <p className="text-sm">{article.marque || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tags className="h-4 w-4" />
                  <span>Classification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-sm">{articleTypeLabels[article.type]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Famille</label>
                  <p className="text-sm">{article.famille || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sous-famille</label>
                  <p className="text-sm">{article.sousFamille || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Statut</label>
                  <Badge className={getStatusColor(article.status)}>
                    {articleStatusLabels[article.status]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Warehouse className="h-4 w-4" />
                  <span>Gestion du stock</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Géré en stock</label>
                  <p className="text-sm">{article.gereEnStock ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Stock physique</label>
                  <p className="text-sm font-bold">
                    {Number(article.stockPhysique || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Stock minimum</label>
                  <p className="text-sm">{Number(article.stockMini || 0).toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Stock maximum</label>
                  <p className="text-sm">{Number(article.stockMaxi || 0).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>État du stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`p-4 rounded-lg border-2 ${
                    stockStatus === 'rupture'
                      ? 'bg-red-50 border-red-200'
                      : stockStatus === 'sous-mini'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        stockStatus === 'rupture'
                          ? 'bg-red-500'
                          : stockStatus === 'sous-mini'
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                      }`}
                    />
                    <span className="font-medium">
                      {stockStatus === 'rupture'
                        ? 'Stock en rupture'
                        : stockStatus === 'sous-mini'
                          ? 'Stock sous le minimum'
                          : 'Stock normal'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {stockStatus === 'rupture'
                      ? 'Aucun stock disponible'
                      : stockStatus === 'sous-mini'
                        ? 'Réapprovisionnement recommandé'
                        : 'Niveau de stock optimal'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Tarification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Prix d'achat standard</label>
                  <p className="text-lg font-bold">
                    {formatCurrency(article.prixAchatStandard ?? 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prix de vente HT</label>
                  <p className="text-lg font-bold">{formatCurrency(article.prixVenteHT ?? 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Taux de TVA</label>
                  <p className="text-sm">{article.tauxTVA ? `${article.tauxTVA}%` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Taux de marge</label>
                  <p className="text-sm">{article.tauxMarge ? `${article.tauxMarge}%` : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Historique</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Créé le</label>
                <p className="text-sm">{article.createdAt ? formatDate(article.createdAt) : '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Modifié le</label>
                <p className="text-sm">{article.updatedAt ? formatDate(article.updatedAt) : '-'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ArticleFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        article={article}
        mode="edit"
      />

      <InventoryDialog
        open={showInventoryDialog}
        onOpenChange={setShowInventoryDialog}
        article={article}
      />

      <DuplicateArticleDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        article={article}
      />
    </div>
  )
}
