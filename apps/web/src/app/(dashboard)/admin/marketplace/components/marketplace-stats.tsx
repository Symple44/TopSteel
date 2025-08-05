'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from '@erp/ui'
import { AlertTriangle, BarChart3, Download, Loader2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { callClientApi } from '@/utils/backend-api'

interface MarketplaceStats {
  overview: {
    totalModules: number
    publishedModules: number
    freeModules: number
    paidModules: number
    totalDownloads: number
    averageRating: number
  }
  categoryBreakdown: Record<string, number>
}

const CATEGORY_LABELS = {
  HR: 'RH',
  PROCUREMENT: 'Achats',
  ANALYTICS: 'Analytics',
  INTEGRATION: 'Intégrations',
  QUALITY: 'Qualité',
  MAINTENANCE: 'Maintenance',
  FINANCE: 'Finance',
}

const CATEGORY_COLORS = {
  HR: 'bg-blue-500',
  PROCUREMENT: 'bg-green-500',
  ANALYTICS: 'bg-purple-500',
  INTEGRATION: 'bg-orange-500',
  QUALITY: 'bg-red-500',
  MAINTENANCE: 'bg-yellow-500',
  FINANCE: 'bg-pink-500',
}

export function MarketplaceStats() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await callClientApi('admin/marketplace/stats')

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        toast.error('Impossible de charger les statistiques')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des statistiques...</span>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">{error || 'Aucune statistique disponible'}</p>
        <p className="text-sm text-muted-foreground">
          Les statistiques s'afficheront automatiquement quand des modules seront utilisés
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    )
  }

  const { overview, categoryBreakdown } = stats
  const totalCategoryModules = Object.values(categoryBreakdown).reduce(
    (sum, count) => sum + count,
    0
  )

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules Totaux</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalModules}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{overview.publishedModules} publiés</span>
              <span>•</span>
              <span>{overview.freeModules} gratuits</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.averageRating}/5</div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.floor(overview.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Catégorie</CardTitle>
          <CardDescription>Distribution des modules par domaine fonctionnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, count]) => {
              const percentage = totalCategoryModules > 0 ? (count / totalCategoryModules) * 100 : 0
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`}
                      />
                      <span>{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}</span>
                    </div>
                    <span className="font-medium">{count} modules</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Détaillées</CardTitle>
          <CardDescription>
            Données disponibles après utilisation réelle des modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Les statistiques détaillées apparaîtront ici :
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Modules les plus téléchargés</li>
              <li>• Analyses d'usage et performance</li>
              <li>• Revenus générés par module</li>
              <li>• Feedback utilisateurs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
