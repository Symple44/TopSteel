'use client'

export const dynamic = 'force-dynamic'

import {
  Alert,
  AlertDescription,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  PageContainer,
  PageHeader,
  PageSection,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useUniqueId,
} from '@erp/ui'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileJson,
  FolderTree,
  Home,
  Layers,
  LayoutGrid,
  Loader2,
  Menu,
  MoreHorizontal,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../../../../lib/i18n/hooks'
import type { MenuItem } from '../../../../types/menu'
import { callClientApi } from '../../../../utils/backend-api'

// Fonction utilitaire pour formater les dates
const formatDate = (date: string | Date) => {
  const d = new Date(date)
  return d?.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatRelativeDate = (date: string | Date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  return formatDate(date)
}

interface MenuConfiguration {
  id: string
  name: string
  description?: string
  isActive: boolean
  isDefault: boolean
  isSystem?: boolean
  createdAt: string
  updatedAt: string
}

export default function MenuConfigurationPage() {
  const { t } = useTranslation('admin')
  const router = useRouter()
  const [configurations, setConfigurations] = useState<MenuConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<MenuConfiguration | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadConfigurations = useCallback(async () => {
    try {
      setError(null)
      const response = await callClientApi('admin/menu-config')
      const data = await response?.json()
      // Handle nested response structure from NestJS TransformInterceptor
      // Response format: { data: { success, data: [...] }, statusCode, message, timestamp }
      const innerData = data?.data || data
      if (innerData?.success) {
        setConfigurations(innerData?.data || [])
      } else {
        setError(innerData?.message || data?.message || 'Erreur lors du chargement')
      }
    } catch (_error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfigurations()
  }, [loadConfigurations])

  const handleActivateConfig = async (config: MenuConfiguration) => {
    setActionLoading(config.id)
    try {
      const response = await callClientApi(`admin/menu-config/${config.id}/activate`, {
        method: 'POST',
      })

      if (response?.ok) {
        await loadConfigurations()
      }
    } catch (_error) {
      setError("Erreur lors de l'activation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteConfig = async () => {
    if (!selectedConfig) return

    setActionLoading(selectedConfig.id)
    try {
      const response = await callClientApi(`admin/menu-config/${selectedConfig.id}`, {
        method: 'DELETE',
      })

      if (response?.ok) {
        setIsDeleteDialogOpen(false)
        setSelectedConfig(null)
        await loadConfigurations()
      }
    } catch (_error) {
      setError('Erreur lors de la suppression')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportConfig = async (configId: string) => {
    try {
      const response = await callClientApi(`admin/menu-config/${configId}/export`)
      const data = await response?.json()
      const innerData = data?.data || data
      if (innerData?.success) {
        const blob = new Blob([JSON.stringify(innerData.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `menu-config-${configId}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (_error) {
      setError("Erreur lors de l'export")
    }
  }

  const handleCreateDefault = async () => {
    setActionLoading('default')
    try {
      const response = await callClientApi('admin/menu-config/default', {
        method: 'POST',
      })

      if (response?.ok) {
        await loadConfigurations()
      }
    } catch (_error) {
      setError('Erreur lors de la création')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSyncMenu = async () => {
    setActionLoading('sync')
    try {
      const response = await callClientApi('admin/menu-config/sync', {
        method: 'POST',
      })

      if (response?.ok) {
        await loadConfigurations()
      }
    } catch (_error) {
      setError('Erreur lors de la synchronisation')
    } finally {
      setActionLoading(null)
    }
  }

  const activeConfig = configurations?.find((c) => c.isActive)

  if (loading) {
    return (
      <PageContainer maxWidth="full" padding="default">
        <div className="space-y-6">
          <div className="h-20 w-full bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 w-full bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <TooltipProvider>
      <PageContainer maxWidth="full" padding="default">
        <PageHeader
          title={t('menuConfig.title')}
          description={t('menuConfig.description')}
          icon={Menu}
          iconBackground="bg-gradient-to-br from-purple-500 to-pink-600"
          actions={
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncMenu}
                    disabled={actionLoading === 'sync'}
                  >
                    {actionLoading === 'sync' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Synchroniser</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Synchroniser le menu depuis la structure du code</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateDefault}
                    disabled={actionLoading === 'default'}
                  >
                    {actionLoading === 'default' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Menu par défaut</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Créer une configuration avec le menu par défaut</p>
                </TooltipContent>
              </Tooltip>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="ml-2">Nouvelle configuration</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                      Nouvelle configuration de menu
                    </DialogTitle>
                    <DialogDescription>
                      Créez une nouvelle configuration de menu que vous pourrez personnaliser.
                    </DialogDescription>
                  </DialogHeader>
                  <MenuConfigForm
                    onSave={() => {
                      setIsCreateDialogOpen(false)
                      loadConfigurations()
                    }}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <PageSection spacing="default">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  Fermer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Active Configuration Banner */}
          {activeConfig && (
            <Card className="mb-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Configuration active
                      </p>
                      <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                        {activeConfig.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedConfig(activeConfig)
                      setIsPreviewDialogOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{configurations.length}</p>
                    <p className="text-sm text-muted-foreground">Configurations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Power className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{configurations.filter((c) => c.isActive).length}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{configurations.filter((c) => c.isSystem).length}</p>
                    <p className="text-sm text-muted-foreground">Système</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configurations Grid */}
          {configurations.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FolderTree className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Aucune configuration</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                    Créez votre première configuration de menu pour personnaliser la navigation.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button variant="outline" onClick={handleSyncMenu}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Synchroniser depuis le code
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configurations.map((config) => (
                <ConfigurationCard
                  key={config.id}
                  config={config}
                  isLoading={actionLoading === config.id}
                  onActivate={() => handleActivateConfig(config)}
                  onPreview={() => {
                    setSelectedConfig(config)
                    setIsPreviewDialogOpen(true)
                  }}
                  onEdit={() => router.push(`/admin/menu-config/${config.id}/edit`)}
                  onExport={() => handleExportConfig(config.id)}
                  onDelete={() => {
                    setSelectedConfig(config)
                    setIsDeleteDialogOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </PageSection>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Aperçu: {selectedConfig?.name}
              </DialogTitle>
              <DialogDescription>
                Visualisez la structure du menu telle qu'elle apparaîtra dans la navigation.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <MenuTreePreview configId={selectedConfig?.id} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Supprimer la configuration
              </DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer la configuration "{selectedConfig?.name}" ?
                Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfig}
                disabled={actionLoading === selectedConfig?.id}
              >
                {actionLoading === selectedConfig?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </TooltipProvider>
  )
}

// Configuration Card Component
function ConfigurationCard({
  config,
  isLoading,
  onActivate,
  onPreview,
  onEdit,
  onExport,
  onDelete,
}: {
  config: MenuConfiguration
  isLoading: boolean
  onActivate: () => void
  onPreview: () => void
  onEdit: () => void
  onExport: () => void
  onDelete: () => void
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${
        config.isActive
          ? 'ring-2 ring-green-500 dark:ring-green-600'
          : 'hover:border-primary/50'
      }`}
    >
      {config.isActive && (
        <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
          <div className="absolute top-3 right-[-35px] w-[170px] transform rotate-45 bg-green-500 text-white text-xs font-semibold py-1 text-center shadow-sm">
            Active
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                config.isActive
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : config.isSystem
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-primary/10'
              }`}
            >
              {config.isSystem ? (
                <Shield className={`h-5 w-5 ${config.isActive ? 'text-green-600' : 'text-blue-600'}`} />
              ) : (
                <LayoutGrid className={`h-5 w-5 ${config.isActive ? 'text-green-600' : 'text-primary'}`} />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{config.name}</CardTitle>
              {config.isSystem && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Système
                </Badge>
              )}
            </div>
          </div>
        </div>
        {config.description && (
          <CardDescription className="mt-2 line-clamp-2">{config.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="h-3.5 w-3.5" />
          <span>Modifié {formatRelativeDate(config.updatedAt)}</span>
        </div>

        <div className="flex items-center gap-2">
          {!config.isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={onActivate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4 mr-1.5" />
                  )}
                  Activer
                </Button>
              </TooltipTrigger>
              <TooltipContent>Définir comme configuration active</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aperçu du menu</TooltipContent>
          </Tooltip>

          {!config.isSystem && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modifier le contenu</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exporter en JSON</TooltipContent>
          </Tooltip>

          {!config.isSystem && !config.isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Supprimer</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Menu Config Form
function MenuConfigForm({
  onSave,
  onCancel,
}: {
  onSave: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameFieldId = useUniqueId('name')
  const descriptionFieldId = useUniqueId('description')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await callClientApi('admin/menu-config', {
        method: 'POST',
        body: JSON.stringify({ ...formData, items: [] }),
      })

      if (response?.ok) {
        onSave()
      } else {
        const data = await response?.json()
        setError(data?.message || 'Erreur lors de la création')
      }
    } catch (_error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={nameFieldId}>Nom de la configuration *</Label>
        <Input
          id={nameFieldId}
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Menu principal, Menu simplifié..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={descriptionFieldId}>Description</Label>
        <Textarea
          id={descriptionFieldId}
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Description optionnelle de cette configuration..."
          rows={3}
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading || !formData.name.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Créer
        </Button>
      </DialogFooter>
    </form>
  )
}

// Menu Tree Preview Component
function MenuTreePreview({ configId }: { configId?: string }) {
  const [menuTree, setMenuTree] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const loadMenuTree = useCallback(async () => {
    if (!configId) return

    try {
      const response = await callClientApi(`admin/menu-config/tree?configId=${configId}`)
      const data = await response?.json()
      const innerData = data?.data || data
      if (innerData?.success) {
        const menuItems = innerData?.data || []
        setMenuTree(menuItems)
        // Expand all top-level items by default
        const topLevelIds = menuItems.map((item: MenuItem) => item.id)
        setExpandedItems(new Set(topLevelIds))
      }
    } catch (_error) {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [configId])

  useEffect(() => {
    if (configId) {
      setLoading(true)
      loadMenuTree()
    }
  }, [configId, loadMenuTree])

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-4 flex-1 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (menuTree.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderTree className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Aucun élément dans cette configuration</p>
      </div>
    )
  }

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors hover:bg-muted/50 ${
            depth === 0 ? 'bg-muted/30' : ''
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(item.id)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              depth === 0 ? 'bg-primary/10' : 'bg-muted'
            }`}
          >
            {getMenuIcon(item.icon)}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`truncate ${depth === 0 ? 'font-medium' : 'text-sm'}`}>
              {item.title}
            </p>
            {item.href && (
              <p className="text-xs text-muted-foreground truncate">{item.href}</p>
            )}
          </div>

          {item.requiredRoles && item.requiredRoles.length > 0 && (
            <Badge variant="outline" className="text-xs shrink-0">
              <Shield className="h-3 w-3 mr-1" />
              {item.requiredRoles.length}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children?.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return <div className="space-y-1 p-2">{menuTree.map((item) => renderMenuItem(item))}</div>
}

// Helper function to get icon component
function getMenuIcon(iconName?: string) {
  const iconClass = 'h-4 w-4 text-muted-foreground'

  switch (iconName?.toLowerCase()) {
    case 'home':
      return <Home className={iconClass} />
    case 'search':
      return <Search className={iconClass} />
    case 'settings':
      return <Settings className={iconClass} />
    case 'shield':
      return <Shield className={iconClass} />
    case 'menu':
      return <Menu className={iconClass} />
    case 'externallink':
      return <ExternalLink className={iconClass} />
    default:
      return <LayoutGrid className={iconClass} />
  }
}
