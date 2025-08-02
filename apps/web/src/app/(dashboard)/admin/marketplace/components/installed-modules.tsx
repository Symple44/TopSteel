'use client'

import {
  Activity,
  Calendar,
  ExternalLink,
  MoreVertical,
  Power,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { 
  Badge, 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@erp/ui'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/hooks'

interface InstalledModule {
  id: string
  moduleKey: string
  displayName: string
  description: string
  category: string
  version: string
  publisher: string
  installedAt: string
  lastUsedAt: string
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR'
  usageStats: {
    dailyActiveUsers: number
    monthlyUsage: number
    features: { name: string; usage: number }[]
  }
}

const MOCK_INSTALLED_MODULES: InstalledModule[] = [
  {
    id: '1',
    moduleKey: 'procurement-optimizer',
    displayName: 'Optimisation des Achats',
    description: "Mutualisation des demandes d'achats et négociation groupée",
    category: 'PROCUREMENT',
    version: '1.5.2',
    publisher: 'ProcureMax',
    installedAt: '2024-01-10T10:30:00Z',
    lastUsedAt: '2024-01-24T15:45:00Z',
    status: 'ACTIVE',
    usageStats: {
      dailyActiveUsers: 12,
      monthlyUsage: 387,
      features: [
        { name: 'Demandes groupées', usage: 156 },
        { name: 'Comparateur fournisseurs', usage: 89 },
        { name: 'Marketplace B2B', usage: 142 },
      ],
    },
  },
  {
    id: '2',
    moduleKey: 'quality-compliance',
    displayName: 'Conformité Qualité',
    description: 'Suivi des normes ISO, certifications et audits qualité',
    category: 'QUALITY',
    version: '2.3.1',
    publisher: 'QualityFirst',
    installedAt: '2024-01-05T09:15:00Z',
    lastUsedAt: '2024-01-23T11:20:00Z',
    status: 'ACTIVE',
    usageStats: {
      dailyActiveUsers: 8,
      monthlyUsage: 234,
      features: [
        { name: 'Suivi certifications', usage: 98 },
        { name: 'Audits qualité', usage: 76 },
        { name: 'Reporting conformité', usage: 60 },
      ],
    },
  },
  {
    id: '3',
    moduleKey: 'hr-basic-tools',
    displayName: 'Outils RH Basiques',
    description: 'Gestion basique des congés et évaluations',
    category: 'HR',
    version: '1.0.5',
    publisher: 'HRTools Inc.',
    installedAt: '2023-12-15T14:22:00Z',
    lastUsedAt: '2024-01-15T16:30:00Z',
    status: 'INACTIVE',
    usageStats: {
      dailyActiveUsers: 2,
      monthlyUsage: 45,
      features: [
        { name: 'Gestion congés', usage: 23 },
        { name: 'Évaluations', usage: 12 },
        { name: 'Planning équipes', usage: 10 },
      ],
    },
  },
  {
    id: '4',
    moduleKey: 'integration-connector',
    displayName: 'Connecteur ERP',
    description: 'Intégration avec systèmes externes',
    category: 'INTEGRATION',
    version: '2.1.0',
    publisher: 'IntegrationPro',
    installedAt: '2024-01-20T08:45:00Z',
    lastUsedAt: '2024-01-24T09:12:00Z',
    status: 'ERROR',
    usageStats: {
      dailyActiveUsers: 0,
      monthlyUsage: 12,
      features: [
        { name: 'Sync SAP', usage: 8 },
        { name: 'Export données', usage: 4 },
        { name: 'Webhook listener', usage: 0 },
      ],
    },
  },
]

const getStatusConfig = (t: (key: string) => string) => ({
  ACTIVE: {
    label: t('marketplace.installedModules.status.active'),
    color: 'bg-green-500',
    variant: 'default' as const,
  },
  INACTIVE: {
    label: t('marketplace.installedModules.status.inactive'),
    color: 'bg-gray-500',
    variant: 'secondary' as const,
  },
  ERROR: {
    label: t('marketplace.installedModules.status.error'),
    color: 'bg-red-500',
    variant: 'destructive' as const,
  },
})

export function InstalledModules() {
  const { t } = useTranslation('admin')
  const [modules, setModules] = useState<InstalledModule[]>(MOCK_INSTALLED_MODULES)
  const [selectedModule, setSelectedModule] = useState<InstalledModule | null>(null)

  const handleToggleStatus = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          const newStatus = module.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          toast({
            title:
              newStatus === 'ACTIVE'
                ? t('marketplace.installedModules.moduleActivated')
                : t('marketplace.installedModules.moduleDeactivated'),
            description:
              newStatus === 'ACTIVE'
                ? t('marketplace.installedModules.moduleActivatedDesc').replace(
                    '{name}',
                    module.displayName
                  )
                : t('marketplace.installedModules.moduleDeactivatedDesc').replace(
                    '{name}',
                    module.displayName
                  ),
          })
          return { ...module, status: newStatus }
        }
        return module
      })
    )
  }

  const handleUninstall = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId)
    if (module) {
      setModules((prev) => prev.filter((m) => m.id !== moduleId))
      toast({
        title: t('marketplace.installedModules.moduleUninstalled'),
        description: t('marketplace.installedModules.moduleUninstalledDesc').replace(
          '{name}',
          module.displayName
        ),
        variant: 'destructive',
      })
    }
  }

  const handleUpdate = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId)
    if (module) {
      toast({
        title: t('marketplace.installedModules.updateStarted'),
        description: t('marketplace.installedModules.updateInProgress').replace(
          '{name}',
          module.displayName
        ),
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDaysSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketplace.installedModules.activeModules')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules.filter((m) => m.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketplace.installedModules.dailyActiveUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules.reduce((sum, m) => sum + m.usageStats.dailyActiveUsers, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('marketplace.installedModules.monthlyUsage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules.reduce((sum, m) => sum + m.usageStats.monthlyUsage, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des modules */}
      <div className="space-y-4">
        {modules.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{module.displayName}</CardTitle>
                    <Badge variant={getStatusConfig(t)[module.status].variant}>
                      {getStatusConfig(t)[module.status].label}
                    </Badge>
                  </div>
                  <CardDescription>
                    {module.description} • v{module.version} {t('marketplace.installedModules.by')}{' '}
                    {module.publisher}
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedModule(module)}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('marketplace.installedModules.actions.configure')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(module.id)}>
                      <Power className="mr-2 h-4 w-4" />
                      {module.status === 'ACTIVE'
                        ? t('marketplace.installedModules.actions.deactivate')
                        : t('marketplace.installedModules.actions.activate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdate(module.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t('marketplace.installedModules.actions.update')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleUninstall(module.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('marketplace.installedModules.actions.uninstall')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t('marketplace.installedModules.installedOn')}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(module.installedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('marketplace.installedModules.daysAgo').replace(
                      '{days}',
                      getDaysSince(module.installedAt).toString()
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t('marketplace.installedModules.lastUsed')}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {formatDate(module.lastUsedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('marketplace.installedModules.daysAgo').replace(
                      '{days}',
                      getDaysSince(module.lastUsedAt).toString()
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {t('marketplace.installedModules.activeUsers')}
                  </p>
                  <p className="text-lg font-semibold">{module.usageStats.dailyActiveUsers}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('marketplace.installedModules.perDay')}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('marketplace.installedModules.usage')}</p>
                  <p className="text-lg font-semibold">{module.usageStats.monthlyUsage}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('marketplace.installedModules.actionsThisMonth')}
                  </p>
                </div>
              </div>

              {module.status === 'ERROR' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ⚠️ {t('marketplace.installedModules.moduleHasIssues')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {t('marketplace.installedModules.noModulesInstalled')}.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              window.location.href = '#catalog'
            }}
          >
            {t('marketplace.installedModules.browse')}
          </Button>
        </div>
      )}

      {/* Dialog de configuration */}
      <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('marketplace.installedModules.configuration')} - {selectedModule?.displayName}
            </DialogTitle>
            <DialogDescription>
              {t('marketplace.installedModules.configurationDesc')}
            </DialogDescription>
          </DialogHeader>

          {selectedModule && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">
                  {t('marketplace.installedModules.mostUsedFeatures')}
                </h4>
                <div className="space-y-2">
                  {selectedModule.usageStats.features.map((feature) => (
                    <div key={feature.name} className="flex items-center justify-between text-sm">
                      <span>{feature.name}</span>
                      <span className="font-medium">
                        {feature.usage} {t('marketplace.installedModules.usages')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedModule(null)}>
                  {t('marketplace.installedModules.close')}
                </Button>
                <Button>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('marketplace.installedModules.openModule')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
