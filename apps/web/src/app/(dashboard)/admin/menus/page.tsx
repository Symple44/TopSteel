'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { Plus, Settings, Download, Upload, Play, Trash2, Edit } from 'lucide-react'
import { MenuConfigurationList } from './components/menu-configuration-list'
import { MenuConfigurationEditor } from './components/menu-configuration-editor'
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
  items: MenuItem[]
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

  useEffect(() => {
    loadConfigurations()
    loadMenuTypes()
  }, [])

  // Charger les items quand une configuration est sélectionnée
  useEffect(() => {
    if (selectedConfig?.id) {
      loadMenuItems(selectedConfig.id)
    } else {
      setSelectedConfigItems([])
    }
  }, [selectedConfig])

  const loadConfigurations = async () => {
    try {
      const [configsResponse, activeResponse] = await Promise.all([
        apiClient.get('/admin/menu-raw/configurations'),
        apiClient.get('/admin/menu-raw/configurations/active')
      ])
      
      // L'API menu-raw retourne une structure imbriquée: { data: { success: true, data: [...] } }
      const responseData = configsResponse.data?.data || configsResponse.data
      const configs = Array.isArray(responseData) ? responseData : []
      setConfigurations(configs)
      if (activeResponse.data) {
        setActiveConfig(activeResponse.data.configuration)
        if (!selectedConfig) {
          setSelectedConfig(activeResponse.data.configuration)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMenuTypes = async () => {
    try {
      const response = await apiClient.get('/admin/menus/menu-types')
      setMenuTypes(response.data.types)
    } catch (error) {
      console.error('Erreur lors du chargement des types de menu:', error)
    }
  }

  const loadMenuItems = async (configId: string) => {
    try {
      const response = await apiClient.get(`/admin/menu-raw/tree?configId=${configId}`)
      const responseData = response.data?.data || response.data
      const items = Array.isArray(responseData) ? responseData : []
      setSelectedConfigItems(items)
    } catch (error) {
      console.error('Erreur lors du chargement des items de menu:', error)
      setSelectedConfigItems([])
    }
  }

  const handleActivateConfiguration = async (configId: string) => {
    try {
      await apiClient.post(`/admin/menus/configurations/${configId}/activate`)
      await loadConfigurations()
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error)
    }
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
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleCreateDefault = async () => {
    try {
      await apiClient.post('/admin/menus/configurations/default')
      await loadConfigurations()
    } catch (error) {
      console.error('Erreur lors de la création de la configuration par défaut:', error)
    }
  }

  const handleExportConfig = async (configId: string) => {
    try {
      const response = await apiClient.get(`/admin/menus/configurations/${configId}/export`)
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `menu-config-${configId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
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
          <p className="text-muted-foreground">
            Configurez et gérez les menus de l'application
          </p>
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
                onSelect={setSelectedConfig}
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
          <Tabs value={editMode} onValueChange={(value) => setEditMode(value as any)}>
            <TabsList>
              <TabsTrigger value="view">Aperçu</TabsTrigger>
              <TabsTrigger value="edit" disabled={!selectedConfig}>Éditer</TabsTrigger>
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
                            {selectedConfig.isActive && (
                              <Badge variant="default">Active</Badge>
                            )}
                            {selectedConfig.isSystem && (
                              <Badge variant="secondary">Système</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {selectedConfig.description}
                          </CardDescription>
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
                  configuration={selectedConfig}
                  menuTypes={menuTypes}
                  onSave={async (config) => {
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
                onSave={async (config) => {
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