'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
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
  Switch,
  Alert,
  AlertDescription
} from '@erp/ui'
import { PermissionHide } from '@/components/auth/permission-guard'
import { 
  Plus,
  Edit,
  Trash2,
  Settings,
  Download,
  Upload,
  Eye,
  Power,
  Zap,
  Check,
  AlertTriangle
} from 'lucide-react'
// Fonction utilitaire pour formater les dates
const formatDate = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
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
  const [configurations, setConfigurations] = useState<MenuConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<MenuConfiguration | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('configurations')

  useEffect(() => {
    loadConfigurations()
  }, [])

  const loadConfigurations = async () => {
    try {
      const response = await fetch('/api/admin/menu-config')
      const data = await response.json()
      if (data.success) {
        setConfigurations(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivateConfig = async (configId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir activer cette configuration ? La configuration actuelle sera désactivée.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/menu-config/${configId}/activate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        loadConfigurations()
        // Recharger la page pour appliquer le nouveau menu
        window.location.reload()
      }
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error)
    }
  }

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/menu-config/${configId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadConfigurations()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const handleExportConfig = async (configId: string) => {
    try {
      window.open(`/api/admin/menu-config/${configId}/export`, '_blank')
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  const handleCreateDefault = async () => {
    try {
      const response = await fetch('/api/admin/menu-config/default', {
        method: 'POST'
      })
      
      if (response.ok) {
        loadConfigurations()
      }
    } catch (error) {
      console.error('Erreur lors de la création de la configuration par défaut:', error)
    }
  }

  const activeConfig = configurations.find(c => c.isActive)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Chargement des configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Configuration du Menu</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les configurations de menu et personnalisez la navigation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCreateDefault}>
            <Zap className="h-4 w-4 mr-2" />
            Menu par défaut
          </Button>
          {/* <PermissionHide permission="MENU_CREATE" roles={['SUPER_ADMIN']}> */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle configuration de menu</DialogTitle>
                </DialogHeader>
                <MenuConfigForm 
                  onSave={() => {
                    setIsCreateDialogOpen(false)
                    loadConfigurations()
                  }} 
                />
              </DialogContent>
            </Dialog>
          {/* </PermissionHide> */}
        </div>
      </div>

      {/* Configuration active */}
      {activeConfig && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            Configuration active : <strong>{activeConfig.name}</strong>
            {activeConfig.description && ` - ${activeConfig.description}`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configurations">Configurations ({configurations.length})</TabsTrigger>
          <TabsTrigger value="preview">Aperçu du menu</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurations de menu</CardTitle>
              <CardDescription>
                Gérez vos différentes configurations de menu de navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{config.name}</span>
                          {config.isActive && (
                            <Badge variant="default" className="text-xs">
                              <Power className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{config.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={config.isSystem ? 'secondary' : 'outline'}>
                          {config.isSystem ? 'Système' : 'Personnalisée'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(config.createdAt)}
                      </TableCell>
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
                  <p>Aucune configuration de menu trouvée</p>
                  <p className="text-sm">Créez votre première configuration pour personnaliser la navigation</p>
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
            <DialogTitle>Modifier la configuration: {selectedConfig?.name}</DialogTitle>
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
            <DialogTitle>Aperçu: {selectedConfig?.name}</DialogTitle>
          </DialogHeader>
          <MenuConfigPreview config={selectedConfig} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant pour créer une configuration
function MenuConfigForm({ onSave }: { onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/menu-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: [] // Commencer avec un menu vide
        })
      })
      
      if (response.ok) {
        onSave()
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom de la configuration</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Menu commercial, Menu production..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez cette configuration de menu..."
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSave}>
          Annuler
        </Button>
        <Button type="submit">
          Créer
        </Button>
      </div>
    </form>
  )
}

// Composant pour éditer une configuration (placeholder)
function MenuConfigEditor({ config, onSave }: { config: MenuConfiguration | null, onSave: () => void }) {
  if (!config) return null

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          L'éditeur de menu avancé sera disponible dans une prochaine version.
          Pour le moment, vous pouvez exporter/importer des configurations.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-end">
        <Button onClick={onSave}>
          Fermer
        </Button>
      </div>
    </div>
  )
}

// Composant pour prévisualiser une configuration
function MenuConfigPreview({ config }: { config: MenuConfiguration | null }) {
  const [menuTree, setMenuTree] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (config) {
      loadMenuTree()
    }
  }, [config])

  const loadMenuTree = async () => {
    if (!config) return

    try {
      const response = await fetch(`/api/admin/menu-config/tree?configId=${config.id}`)
      const data = await response.json()
      if (data.success) {
        setMenuTree(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'arbre de menu:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement de l'aperçu...</div>
  }

  const renderMenuItem = (item: any, depth: number = 0) => (
    <div key={item.id} className={`ml-${depth * 4} py-1`}>
      <div className="flex items-center space-x-2">
        <span style={{ marginLeft: `${depth * 16}px` }}>
          {item.icon && <span className="w-4 h-4">📄</span>}
          <span className={depth === 0 ? 'font-semibold' : ''}>{item.title}</span>
          {item.badge && (
            <Badge variant="outline" className="text-xs">{item.badge}</Badge>
          )}
        </span>
      </div>
      {item.children?.map((child: any) => renderMenuItem(child, depth + 1))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h3 className="font-medium mb-3">Structure du menu</h3>
        {menuTree.length > 0 ? (
          <div className="space-y-1">
            {menuTree.map(item => renderMenuItem(item))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun item de menu configuré</p>
        )}
      </div>
    </div>
  )
}

// Composant pour prévisualiser le menu actuel
function MenuPreview() {
  const [menuTree, setMenuTree] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentMenu()
  }, [])

  const loadCurrentMenu = async () => {
    try {
      const response = await fetch('/api/admin/menu-config/tree/filtered')
      const data = await response.json()
      if (data.success) {
        setMenuTree(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du menu actuel:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement du menu...</div>
  }

  const renderMenuItem = (item: any, depth: number = 0) => (
    <div key={item.id} className="py-2 border-b last:border-b-0">
      <div className="flex items-center space-x-3" style={{ paddingLeft: `${depth * 20}px` }}>
        {item.icon && <span className="w-5 h-5 text-gray-500">📄</span>}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className={`${depth === 0 ? 'font-semibold text-lg' : 'font-medium'}`}>
              {item.title}
            </span>
            {item.badge && (
              <Badge variant="outline" className="text-xs">{item.badge}</Badge>
            )}
          </div>
          {item.href && (
            <p className="text-sm text-muted-foreground">{item.href}</p>
          )}
        </div>
      </div>
      {item.children?.map((child: any) => renderMenuItem(child, depth + 1))}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu de navigation actuel</CardTitle>
        <CardDescription>
          Aperçu du menu tel qu'il apparaît pour votre utilisateur
        </CardDescription>
      </CardHeader>
      <CardContent>
        {menuTree.length > 0 ? (
          <div className="space-y-0 border rounded-lg">
            {menuTree.map(item => renderMenuItem(item))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun menu configuré ou accessible</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}