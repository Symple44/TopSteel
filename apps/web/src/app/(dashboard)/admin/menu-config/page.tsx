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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useUniqueId,
} from '@erp/ui'
import { Menu } from 'lucide-react'
import {
  AlertTriangle,
  Check,
  Download,
  Edit,
  Eye,
  Plus,
  Power,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react'
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

interface MenuConfiguration {
  id: string
  name: string
  description?: string
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export default function MenuConfigurationPage() {
  const { t } = useTranslation('admin')
  const [configurations, setConfigurations] = useState<MenuConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<MenuConfiguration | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('configurations')

  const loadConfigurations = useCallback(async () => {
    try {
      const response = await callClientApi('admin/menu-config')
      const data = await response?.json()
      if (data?.success) {
        setConfigurations(data?.data)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfigurations()
  }, [loadConfigurations])

  const handleActivateConfig = async (configId: string) => {
    if (!confirm(t('menuConfig.confirmActivate'))) {
      return
    }

    try {
      const response = await callClientApi(`admin/menu-config/${configId}/activate`, {
        method: 'POST',
      })

      if (response?.ok) {
        loadConfigurations()
        // Recharger la page pour appliquer le nouveau menu
        window.location.reload()
      }
    } catch (_error) {}
  }

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm(t('menuConfig.confirmDelete'))) {
      return
    }

    try {
      const response = await callClientApi(`admin/menu-config/${configId}`, {
        method: 'DELETE',
      })

      if (response?.ok) {
        loadConfigurations()
      }
    } catch (_error) {}
  }

  const handleExportConfig = async (configId: string) => {
    try {
      window.open(`/api/admin/menu-config/${configId}/export`, '_blank')
    } catch (_error) {}
  }

  const handleCreateDefault = async () => {
    try {
      const response = await callClientApi('admin/menu-config/default', {
        method: 'POST',
      })

      if (response?.ok) {
        loadConfigurations()
      }
    } catch (_error) {}
  }

  const activeConfig = configurations?.find((c) => c.isActive)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">{t('menuConfig.loadingConfigurations')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <PageHeader
        title={t('menuConfig.title')}
        description={t('menuConfig.description')}
        icon={Menu}
        iconBackground="bg-gradient-to-br from-purple-500 to-pink-600"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCreateDefault}>
              <Zap className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">{t('menuConfig.defaultMenu')}</span>
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="ml-2">{t('menuConfig.newConfiguration')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('menuConfig.createNewConfiguration')}</DialogTitle>
                </DialogHeader>
                <MenuConfigForm
                  onSave={() => {
                    setIsCreateDialogOpen(false)
                    loadConfigurations()
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Configuration active */}
      {activeConfig && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            {t('menuConfig.activeConfiguration')} : <strong>{activeConfig?.name}</strong>
            {activeConfig?.description && ` - ${activeConfig?.description}`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configurations">
            {t('menuConfig.configurations')} ({configurations.length})
          </TabsTrigger>
          <TabsTrigger value="preview">{t('menuConfig.previewLabel')}</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('menuConfig.configurations')}</CardTitle>
              <CardDescription>{t('menuConfig.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('menuConfig.name')}</TableHead>
                    <TableHead>{t('menuConfig.description')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('menuConfig.createdAt')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations?.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{config.name}</span>
                          {config.isActive && (
                            <Badge variant="default" className="text-xs">
                              <Power className="h-3 w-3 mr-1" />
                              {t('menuConfig.active')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{config.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={config.isSystem ? 'secondary' : 'outline'}>
                          {config.isSystem ? t('menuConfig.system') : t('menuConfig.custom')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? t('menuConfig.active') : t('menuConfig.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(config.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedConfig(config)
                              setIsPreviewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {!config.isActive && (
                            // <PermissionHide permission="MENU_ACTIVATE" roles={['SUPER_ADMIN', 'ADMIN']}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivateConfig(config.id)}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            // </PermissionHide>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportConfig(config.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* <PermissionHide permission="MENU_UPDATE" roles={['SUPER_ADMIN', 'ADMIN']}> */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedConfig(config)
                              setIsEditDialogOpen(true)
                            }}
                            disabled={config.isSystem}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* </PermissionHide> */}

                          {/* <PermissionHide permission="MENU_DELETE" roles={['SUPER_ADMIN']}> */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConfig(config.id)}
                            disabled={config.isSystem || config.isActive}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {/* </PermissionHide> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {configurations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('menuConfig.noConfigurations')}</p>
                  <p className="text-sm">{t('menuConfig.noConfigurationsDescription')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <MenuPreview />
        </TabsContent>
      </Tabs>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('menuConfig.edit')}: {selectedConfig?.name}
            </DialogTitle>
          </DialogHeader>
          <MenuConfigEditor
            config={selectedConfig}
            onSave={() => {
              setIsEditDialogOpen(false)
              loadConfigurations()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'aperçu */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('menuConfig.previewLabel')}: {selectedConfig?.name}
            </DialogTitle>
          </DialogHeader>
          <MenuConfigPreview config={selectedConfig} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant pour créer une configuration
function MenuConfigForm({ onSave }: { onSave: () => void }) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  // Generate unique ID for form fields
  const nameFieldId = useUniqueId('name')
  const descriptionFieldId = useUniqueId('description')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()

    try {
      const response = await callClientApi('admin/menu-config', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          items: [], // Commencer avec un menu vide
        }),
      })

      if (response?.ok) {
        onSave()
      }
    } catch (_error) {}
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={nameFieldId}>{t('menuConfig.name')}</Label>
        <Input
          id={nameFieldId}
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, name: e?.target?.value }))
          }
          placeholder={t('menuConfig.form.namePlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor={descriptionFieldId}>{t('menuConfig.description')}</Label>
        <Textarea
          id={descriptionFieldId}
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, description: e?.target?.value }))
          }
          placeholder={t('menuConfig.form.descriptionPlaceholder')}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSave}>
          {t('menuConfig.form.cancel')}
        </Button>
        <Button type="submit">{t('menuConfig.form.create')}</Button>
      </div>
    </form>
  )
}

// Composant pour éditer une configuration (placeholder)
function MenuConfigEditor({
  config,
  onSave,
}: {
  config: MenuConfiguration | null
  onSave: () => void
}) {
  const { t } = useTranslation('admin')
  if (!config) return null

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('menuConfig.editor.advancedEditorSoon')}
          {t('menuConfig.editor.exportImportInfo')}
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button onClick={onSave}>{t('menuConfig.editor.close')}</Button>
      </div>
    </div>
  )
}

// Composant pour prévisualiser une configuration
function MenuConfigPreview({ config }: { config: MenuConfiguration | null }) {
  const { t } = useTranslation('admin')
  const [menuTree, setMenuTree] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadMenuTree = useCallback(async () => {
    if (!config) return

    try {
      const response = await callClientApi(`admin/menu-config/tree?configId=${config.id}`)
      const data = await response?.json()
      if (data?.success) {
        setMenuTree(data?.data)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [config])

  useEffect(() => {
    if (config) {
      loadMenuTree()
    }
  }, [config, loadMenuTree])

  if (loading) {
    return <div className="text-center py-8">{t('menuConfig.preview.loadingPreview')}</div>
  }

  const renderMenuItem = (item: MenuItem, depth: number = 0) => (
    <div key={item.id} className={`ml-${depth * 4} py-1`}>
      <div className="flex items-center space-x-2">
        <span style={{ marginLeft: `${depth * 16}px` }}>
          {item.icon && <span className="w-4 h-4">📄</span>}
          <span className={depth === 0 ? 'font-semibold' : ''}>{item.title}</span>
          {item.badge && (
            <Badge variant="outline" className="text-xs">
              {item.badge}
            </Badge>
          )}
        </span>
      </div>
      {item.children?.map((child) => renderMenuItem(child, depth + 1))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h3 className="font-medium mb-3">
          {t('menuConfig.preview.menuStructure', { fallback: 'Structure du menu' })}
        </h3>
        {menuTree.length > 0 ? (
          <div className="space-y-1">{menuTree?.map((item) => renderMenuItem(item))}</div>
        ) : (
          <p className="text-muted-foreground">{t('menuConfig.preview.noItems')}</p>
        )}
      </div>
    </div>
  )
}

// Composant pour prévisualiser le menu actuel
function MenuPreview() {
  const { t } = useTranslation('admin')
  const [menuTree, setMenuTree] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadCurrentMenu = useCallback(async () => {
    try {
      const response = await callClientApi('admin/menu-config/tree/filtered')
      const data = await response?.json()
      if (data?.success) {
        setMenuTree(data?.data)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentMenu()
  }, [loadCurrentMenu])

  if (loading) {
    return <div className="text-center py-8">{t('menuConfig.preview.loadingPreview')}</div>
  }

  const renderMenuItem = (item: MenuItem, depth: number = 0) => (
    <div key={item.id} className="py-2 border-b last:border-b-0">
      <div className="flex items-center space-x-3" style={{ paddingLeft: `${depth * 20}px` }}>
        {item.icon && <span className="w-5 h-5 text-gray-500">📄</span>}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`${depth === 0 ? 'font-semibold text-lg' : 'font-medium'}`}>
              {item.title}
            </span>
            {item.badge && (
              <Badge variant="outline" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </div>
          {item.href && <p className="text-sm text-muted-foreground">{item.href}</p>}
        </div>
      </div>
      {item.children?.map((child) => renderMenuItem(child, depth + 1))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('menuConfig.preview.currentNavigationMenu', {
            fallback: 'Menu de navigation actuel',
          })}
        </CardTitle>
        <CardDescription>
          {t('menuConfig.preview.userMenuPreview', {
            fallback: "Aperçu du menu tel qu'il apparaît pour votre utilisateur",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {menuTree.length > 0 ? (
          <div className="space-y-0 border rounded-lg">
            {menuTree?.map((item) => renderMenuItem(item))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {t('menuConfig.preview.noMenuConfigured', {
                fallback: 'Aucun menu configuré ou accessible',
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
