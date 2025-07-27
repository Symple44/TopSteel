'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MarketplaceCatalog } from './components/marketplace-catalog'
import { InstalledModules } from './components/installed-modules'
import { MarketplaceStats } from './components/marketplace-stats'
import { ModulePublisher } from './components/module-publisher'
import { Store, Package, TrendingUp, Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface QuickStats {
  totalModules: number
  publishedModules: number
  totalDownloads: number
  averageRating: number
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState('catalog')
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const response = await fetch('/api/admin/marketplace/stats')
        if (response.ok) {
          const data = await response.json()
          setQuickStats({
            totalModules: data.overview?.totalModules || 0,
            publishedModules: data.overview?.publishedModules || 0,
            totalDownloads: data.overview?.totalDownloads || 0,
            averageRating: data.overview?.averageRating || 0
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques rapides:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuickStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace de Modules</h1>
          <p className="text-muted-foreground">
            Découvrez et installez des modules pour étendre les fonctionnalités de votre ERP
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules Disponibles</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{quickStats?.totalModules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {quickStats?.publishedModules || 0} publiés
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{quickStats?.totalDownloads?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  Installations totales
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {quickStats?.averageRating ? quickStats.averageRating.toFixed(1) : '0'}/5
                </div>
                <p className="text-xs text-muted-foreground">
                  Satisfaction utilisateurs
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketplace</CardTitle>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400">★</div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Actif</div>
            <p className="text-xs text-muted-foreground">
              Modules réels disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">Catalogue</TabsTrigger>
          <TabsTrigger value="installed">Modules Installés</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="publish">Publier un Module</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <MarketplaceCatalog />
        </TabsContent>

        <TabsContent value="installed" className="space-y-4">
          <InstalledModules />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <MarketplaceStats />
        </TabsContent>

        <TabsContent value="publish" className="space-y-4">
          <ModulePublisher />
        </TabsContent>
      </Tabs>
    </div>
  )
}