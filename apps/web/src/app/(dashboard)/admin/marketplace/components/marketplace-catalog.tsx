'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'
import {
  BarChart3,
  DollarSign,
  Download,
  Loader2,
  Search,
  Shield,
  ShoppingCart,
  Star,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/hooks'
import { callClientApi } from '@/utils/backend-api'
import { ModuleDetailsDialog } from './module-details-dialog'

interface MarketplaceModule {
  id: string
  moduleKey: string
  displayName: string
  description: string
  shortDescription?: string
  category: string
  version: string
  publisher: string
  pricing: {
    type: string
    amount?: number
    currency?: string
    period?: string
    description?: string
  }
  icon?: string
  downloadCount: number
  ratingAverage: number
  ratingCount: number
  isInstalled?: boolean
}

// Pas de données mockées - utilisation de l'API réelle

const CATEGORY_ICONS = {
  HR: Users,
  PROCUREMENT: ShoppingCart,
  ANALYTICS: BarChart3,
  INTEGRATION: Zap,
  QUALITY: Shield,
  MAINTENANCE: Wrench,
  FINANCE: DollarSign,
}

// CATEGORY_LABELS sera remplacé par les traductions dans le composant

export function MarketplaceCatalog() {
  const { t } = useTranslation('admin')

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      HR: t('marketplace.categories.hr'),
      PROCUREMENT: t('marketplace.categories.procurement'),
      ANALYTICS: t('marketplace.categories.analytics'),
      INTEGRATION: t('marketplace.categories.integration'),
      QUALITY: t('marketplace.categories.quality'),
      MAINTENANCE: t('marketplace.categories.maintenance'),
      FINANCE: t('marketplace.categories.finance'),
    }
    return categoryLabels[category as keyof typeof categoryLabels] || category
  }

  const [modules, setModules] = useState<MarketplaceModule[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedModule, setSelectedModule] = useState<MarketplaceModule | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les modules depuis l'API
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true)
        const response = await callClientApi('admin/marketplace/modules')

        if (!response.ok) {
          throw new Error(t('marketplace.loadingError'))
        }

        const data = await response.json()
        setModules(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.unknownError'))
        toast.error(t('marketplace.loadingErrorMessage'))
      } finally {
        setLoading(false)
      }
    }

    fetchModules()
  }, [t])

  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      searchQuery === '' ||
      module.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleModuleClick = (module: MarketplaceModule) => {
    setSelectedModule(module)
    setShowDetailsDialog(true)
  }

  const formatPrice = (pricing: MarketplaceModule['pricing']) => {
    switch (pricing.type) {
      case 'FREE':
        return t('marketplace.installedModules.pricing.free')
      case 'ONE_TIME':
        return `${pricing.amount}${pricing.currency} (${t('marketplace.installedModules.pricing.oneTime')})`
      case 'SUBSCRIPTION': {
        const period =
          pricing.period === 'YEAR'
            ? t('marketplace.installedModules.pricing.year')
            : t('marketplace.installedModules.pricing.month')
        return `${pricing.amount}${pricing.currency}/${period}`
      }
      case 'COMMISSION':
        return t('marketplace.installedModules.pricing.commission')
      case 'USAGE_BASED':
        return t('marketplace.installedModules.pricing.usageBased')
      default:
        return t('marketplace.installedModules.pricing.onRequest')
    }
  }

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('marketplace.loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>{t('marketplace.retry')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('marketplace.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('marketplace.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('marketplace.allCategories')}</SelectItem>
            {Object.keys(CATEGORY_ICONS).map((key) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(key)}
                  {getCategoryLabel(key)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grille des modules */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredModules.map((module) => (
          <Card
            key={module.id}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
            onClick={() => handleModuleClick(module)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getCategoryIcon(module.category)}
                  <div>
                    <CardTitle className="text-lg">{module.displayName}</CardTitle>
                    <CardDescription className="text-xs">
                      {t('marketplace.by')} {module.publisher} • v{module.version}
                    </CardDescription>
                  </div>
                </div>
                {module.isInstalled && (
                  <Badge variant="secondary" className="text-xs">
                    {t('marketplace.installed')}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {module.shortDescription || module.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{module.ratingAverage}</span>
                    <span>({module.ratingCount})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{module.downloadCount.toLocaleString()}</span>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs">
                  {getCategoryLabel(module.category)}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="font-medium text-sm">{formatPrice(module.pricing)}</div>

                {module.isInstalled ? (
                  <Button size="sm" variant="outline" disabled>
                    {t('marketplace.installed')}
                  </Button>
                ) : (
                  <Button size="sm">{t('marketplace.viewDetails')}</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('marketplace.noModulesFound')}</p>
        </div>
      )}

      {/* Dialog des détails du module */}
      {selectedModule && (
        <ModuleDetailsDialog
          module={selectedModule}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  )
}
