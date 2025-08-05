'use client'

export const dynamic = 'force-dynamic'

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { Button } from '@erp/ui/primitives'
import { Download, Play, Plus, Settings } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { MenuConfigurationEditor } from './components/menu-configuration-editor'
import { MenuConfigurationList } from './components/menu-configuration-list'
import { MenuPreview } from './components/menu-preview'

interface MenuConfiguration {
  id: string
  name: string
  description?: string
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  items?: MenuItem[] // Make items optional since it's not always present
}

interface MenuItem {
  id: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  icon?: string
  orderIndex: number
  isVisible: boolean
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  children: MenuItem[]
}

interface MenuType {
  value: string
  label: string
  description: string
  icon: string
  canHaveChildren: boolean
  requiredFields: string[]
}

export default function MenuAdminPage() {
  const [configurations, setConfigurations] = useState<MenuConfiguration[]>([])
  const [activeConfig, setActiveConfig] = useState<MenuConfiguration | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<MenuConfiguration | null>(null)
  const [selectedConfigItems, setSelectedConfigItems] = useState<MenuItem[]>([])
  const [menuTypes, setMenuTypes] = useState<MenuType[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<'view' | 'edit' | 'create'>('view')

  const loadConfigurations = useCallback(async () => {
    try {
      const [configsResponse, activeResponse] = await Promise.all([
        apiClient.get('/admin/menu-raw/configurations'),
        apiClient.get('/admin/menu-raw/configurations/active'),
      ])

      // L'API menu-raw retourne une structure imbriquée: { data: { success: true, data: [...] } }
      const responseData = configsResponse?.data?.data || configsResponse?.data
      const configs = Array.isArray(responseData) ? responseData : []
      setConfigurations(configs)
      if (activeResponse?.data) {
        setActiveConfig(activeResponse.data.configuration)
        if (!selectedConfig) {
          setSelectedConfig(activeResponse.data.configuration)
        }
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [selectedConfig])

  const loadMenuTypes = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/menus/menu-types')
      setMenuTypes(response?.data?.types || [])
    } catch (_error) {}
  }, [])

  const loadMenuItems = useCallback(async (configId: string) => {
    try {
      const response = await apiClient.get(`/admin/menu-raw/tree?configId=${configId}`)
      const responseData = response?.data?.data || response?.data
      const items = Array.isArray(responseData) ? responseData : []
      setSelectedConfigItems(items)
    } catch (_error) {
      setSelectedConfigItems([])
    }
  }, [])

  useEffect(() => {
    loadConfigurations()
    loadMenuTypes()
  }, [loadConfigurations, loadMenuTypes])

  // Charger les items quand une configuration est sélectionnée
  useEffect(() => {
    if (selectedConfig?.id) {
      loadMenuItems(selectedConfig.id)
    } else {
      setSelectedConfigItems([])
    }
  }, [selectedConfig, loadMenuItems])

  const handleActivateConfiguration = async (configId: string) => {
    try {
      await apiClient.post(`/admin/menus/configurations/${configId}/activate`)
      await loadConfigurations()
    } catch (_error) {}
  }

  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      return
    }

    try {
      await apiClient.delete(`/admin/menus/configurations/${configId}`)
      await loadConfigurations()
      if (selectedConfig?.id === configId) {
        setSelectedConfig(null)
      }
    } catch (_error) {}
  }

  const handleCreateDefault = async () => {
    try {
      await apiClient.post('/admin/menus/configurations/default')
      await loadConfigurations()
    } catch (_error) {}
  }

  const handleExportConfig = async (configId: string) => {
    try {
      const response = await apiClient.get(`/admin/menus/configurations/${configId}/export`)
      const blob = new Blob([JSON.stringify(response?.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `menu-config-${configId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (_error) {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Menus</h1>
          <p className="text-muted-foreground">Configurez et gérez les menus de l'application</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateDefault}>
            <Settings className="h-4 w-4 mr-2" />
            Créer Config. par Défaut
          </Button>
          <Button onClick={() => setEditMode('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Configuration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Liste des configurations */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurations</CardTitle>
              <CardDescription>
                {configurations.length} configuration(s) disponible(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MenuConfigurationList
                configurations={configurations}
                activeConfig={activeConfig}
                selectedConfig={selectedConfig}
                onSelect={(config: MenuConfiguration) => setSelectedConfig(config)}
                onActivate={handleActivateConfiguration}
                onDelete={handleDeleteConfiguration}
                onExport={handleExportConfig}
                onEdit={(config) => {
                  setSelectedConfig(config)
                  setEditMode('edit')
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          <Tabs
            value={editMode}
            onValueChange={(value: string) => setEditMode(value as 'view' | 'edit' | 'create')}
          >
            <TabsList>
              <TabsTrigger value="view">Aperçu</TabsTrigger>
              <TabsTrigger value="edit" disabled={!selectedConfig}>
                Éditer
              </TabsTrigger>
              <TabsTrigger value="create">Créer</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-4">
              {selectedConfig ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {selectedConfig.name}
                            {selectedConfig.isActive && <Badge variant="default">Active</Badge>}
                            {selectedConfig.isSystem && <Badge variant="secondary">Système</Badge>}
                          </CardTitle>
                          <CardDescription>{selectedConfig.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {!selectedConfig.isActive && (
                            <Button
                              size="sm"
                              onClick={() => handleActivateConfiguration(selectedConfig.id)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Activer
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportConfig(selectedConfig.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <MenuPreview menuItems={selectedConfigItems} />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-48">
                    <p className="text-muted-foreground">
                      Sélectionnez une configuration pour voir l'aperçu
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="edit">
              {selectedConfig && (
                <MenuConfigurationEditor
                  configuration={{
                    ...selectedConfig,
                    items: selectedConfig.items || selectedConfigItems,
                  }}
                  menuTypes={menuTypes}
                  onSave={async () => {
                    await loadConfigurations()
                    setEditMode('view')
                  }}
                  onCancel={() => setEditMode('view')}
                />
              )}
            </TabsContent>

            <TabsContent value="create">
              <MenuConfigurationEditor
                menuTypes={menuTypes}
                onSave={async () => {
                  await loadConfigurations()
                  setEditMode('view')
                }}
                onCancel={() => setEditMode('view')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
