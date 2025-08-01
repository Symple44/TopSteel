'use client'

export const dynamic = 'force-dynamic'

import { Loader2, Package, Settings, Store, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@erp/ui/primitives'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import { useTranslation } from '@/lib/i18n/hooks'
import { callClientApi } from '@/utils/backend-api'
import { InstalledModules } from './components/installed-modules'
import { MarketplaceCatalog } from './components/marketplace-catalog'
import { MarketplaceStats } from './components/marketplace-stats'
import { ModulePublisher } from './components/module-publisher'

interface QuickStats {
  totalModules: number
  publishedModules: number
  totalDownloads: number
  averageRating: number
}

export default function MarketplacePage() {
  const { t } = useTranslation('admin')
  const { t: tMp } = useTranslation('admin')
  const [activeTab, setActiveTab] = useState('catalog')
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const response = await callClientApi('admin/marketplace/stats')
        if (response.ok) {
          const data = await response.json()
          setQuickStats({
            totalModules: data.overview?.totalModules || 0,
            publishedModules: data.overview?.publishedModules || 0,
            totalDownloads: data.overview?.totalDownloads || 0,
            averageRating: data.overview?.averageRating || 0,
          })
        }
      } catch (_error) {
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
          <h1 className="text-3xl font-bold tracking-tight">{t('marketplace.title')}</h1>
          <p className="text-muted-foreground">{t('marketplace.description')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            {t('marketplace.settings')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketplace.modulesAvailable')}
            </CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{quickStats?.totalModules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {quickStats?.publishedModules || 0} {tMp('marketplace.published')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('marketplace.totalDownloads')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {quickStats?.totalDownloads?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">{tMp('marketplace.totalInstalls')}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {tMp('marketplace.averageRating')}
            </CardTitle>
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
                  {tMp('marketplace.userSatisfaction')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tMp('marketplace.title')}</CardTitle>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400">
                  ★
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tMp('marketplace.active')}</div>
            <p className="text-xs text-muted-foreground">{tMp('marketplace.realModules')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalog">{t('marketplace.categories')}</TabsTrigger>
          <TabsTrigger value="installed">{t('marketplace.installed')}</TabsTrigger>
          <TabsTrigger value="stats">{t('marketplace.quickStats')}</TabsTrigger>
          <TabsTrigger value="publish">{tMp('marketplace.publishModule')}</TabsTrigger>
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
