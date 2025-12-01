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
  Input,
  Label,
  PageContainer,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useUniqueId,
} from '@erp/ui'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  Folder,
  GripVertical,
  Home,
  Loader2,
  Menu,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { callClientApi } from '../../../../../../utils/backend-api'

interface MenuItemEdit {
  id: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  icon?: string
  href?: string
  orderIndex: number
  isVisible: boolean
  requiredRoles?: string[]
  children: MenuItemEdit[]
  isExpanded?: boolean
}

interface MenuConfiguration {
  id: string
  name: string
  description?: string
  isActive: boolean
  isSystem?: boolean
}

const AVAILABLE_ICONS = [
  'Home', 'Search', 'Settings', 'Shield', 'Users', 'Building2', 'Database',
  'Menu', 'Folder', 'FileText', 'Monitor', 'Bell', 'Lock', 'Palette',
  'Languages', 'Table', 'UserCog', 'UsersRound', 'Package', 'TrendingUp',
  'CreditCard', 'FolderKanban', 'Factory', 'HardDrive', 'ListChecks', 'Briefcase'
]

const MENU_TYPES = [
  { value: 'M', label: 'Menu/Dossier', description: 'Contient des sous-éléments' },
  { value: 'P', label: 'Programme', description: 'Lien vers une page' },
  { value: 'L', label: 'Lien externe', description: 'Lien vers un site externe' },
  { value: 'D', label: 'Vue de données', description: 'Query Builder' },
]

const AVAILABLE_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'COMPTABLE',
  'TECHNICIEN', 'OPERATEUR', 'USER', 'VIEWER'
]

// Routes disponibles dans l'application avec descriptions
const AVAILABLE_ROUTES = [
  // Accueil
  { path: '/', label: 'Accueil', description: 'Page d\'accueil principale', category: 'Général' },
  { path: '/dashboard', label: 'Tableau de bord', description: 'Dashboard avec indicateurs clés', category: 'Général' },
  { path: '/profile', label: 'Profil', description: 'Profil utilisateur', category: 'Général' },

  // Administration
  { path: '/admin', label: 'Administration', description: 'Page principale d\'administration', category: 'Administration' },
  { path: '/admin/users', label: 'Utilisateurs', description: 'Gestion des utilisateurs', category: 'Administration' },
  { path: '/admin/roles', label: 'Rôles', description: 'Gestion des rôles et permissions', category: 'Administration' },
  { path: '/admin/groups', label: 'Groupes', description: 'Gestion des groupes d\'utilisateurs', category: 'Administration' },
  { path: '/admin/societes', label: 'Sociétés', description: 'Gestion multi-sociétés', category: 'Administration' },
  { path: '/admin/company', label: 'Entreprise', description: 'Configuration de l\'entreprise', category: 'Administration' },
  { path: '/admin/sessions', label: 'Sessions', description: 'Sessions utilisateurs actives', category: 'Administration' },
  { path: '/admin/database', label: 'Base de données', description: 'Administration de la base de données', category: 'Administration' },
  { path: '/admin/menu-config', label: 'Configuration menus', description: 'Gestion des menus de navigation', category: 'Administration' },
  { path: '/admin/translations', label: 'Traductions', description: 'Gestion des traductions i18n', category: 'Administration' },

  // Paramètres
  { path: '/settings', label: 'Paramètres', description: 'Page principale des paramètres', category: 'Paramètres' },
  { path: '/settings/appearance', label: 'Apparence', description: 'Thème et personnalisation visuelle', category: 'Paramètres' },
  { path: '/settings/notifications', label: 'Notifications', description: 'Préférences de notifications', category: 'Paramètres' },
  { path: '/settings/security', label: 'Sécurité', description: 'Mot de passe et authentification', category: 'Paramètres' },
  { path: '/settings/menu', label: 'Menu personnel', description: 'Personnalisation du menu', category: 'Paramètres' },

  // Query Builder
  { path: '/query-builder', label: 'Query Builder', description: 'Constructeur de requêtes', category: 'Outils' },
  { path: '/query-builder/docs', label: 'Documentation QB', description: 'Documentation du Query Builder', category: 'Outils' },

  // Planning
  { path: '/planning/test', label: 'Planning (Test)', description: 'Module de planification', category: 'Production' },

  // Tests (développement)
  { path: '/test-datatable', label: 'Test DataTable', description: 'Page de test des datatables', category: 'Développement' },
  { path: '/test-multi-tenant', label: 'Test Multi-tenant', description: 'Page de test multi-tenant', category: 'Développement' },
  { path: '/admin/datatable-test', label: 'Admin DataTable Test', description: 'Test datatable admin', category: 'Développement' },
] as const

// Grouper les routes par catégorie
const ROUTES_BY_CATEGORY = AVAILABLE_ROUTES.reduce((acc, route) => {
  if (!acc[route.category]) {
    acc[route.category] = []
  }
  acc[route.category].push(route)
  return acc
}, {} as Record<string, typeof AVAILABLE_ROUTES[number][]>)

export default function MenuEditPage() {
  const params = useParams()
  const router = useRouter()
  const configId = params.id as string

  const [config, setConfig] = useState<MenuConfiguration | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItemEdit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItemEdit | null>(null)
  const [parentItemId, setParentItemId] = useState<string | null>(null)

  // Load configuration and menu items
  const loadConfiguration = useCallback(async () => {
    try {
      setError(null)
      const response = await callClientApi(`admin/menu-config/${configId}`)
      const data = await response?.json()
      const innerData = data?.data || data

      if (innerData?.success || innerData?.data) {
        const configData = innerData?.data || innerData
        setConfig({
          id: configData.id,
          name: configData.name,
          description: configData.description,
          isActive: configData.isActive,
          isSystem: configData.isSystem,
        })
      }
    } catch (_error) {
      setError('Erreur lors du chargement de la configuration')
    }
  }, [configId])

  const loadMenuTree = useCallback(async () => {
    try {
      const response = await callClientApi(`admin/menu-config/tree?configId=${configId}`)
      const data = await response?.json()
      const innerData = data?.data || data

      if (innerData?.success) {
        const items = (innerData?.data || []).map((item: any) => ({
          ...item,
          isExpanded: true,
          children: (item.children || []).map((child: any) => ({
            ...child,
            isExpanded: true,
            children: child.children || [],
          })),
        }))
        setMenuItems(items)
      }
    } catch (_error) {
      setError('Erreur lors du chargement du menu')
    } finally {
      setLoading(false)
    }
  }, [configId])

  useEffect(() => {
    loadConfiguration()
    loadMenuTree()
  }, [loadConfiguration, loadMenuTree])

  // Save all changes
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Convert menu items to API format
      const itemsToSave = convertToApiFormat(menuItems)

      const response = await callClientApi(`admin/menu-config/${configId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: config?.name,
          description: config?.description,
          items: itemsToSave,
        }),
      })

      if (response?.ok) {
        setHasChanges(false)
        // Reload to get updated data
        await loadMenuTree()
      } else {
        const data = await response?.json()
        const innerData = data?.data || data
        setError(innerData?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (_error) {
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  // Convert menu items to API format
  const convertToApiFormat = (items: MenuItemEdit[]): any[] => {
    return items.map((item, index) => ({
      id: item.id.startsWith('new-') ? undefined : item.id,
      title: item.title,
      type: item.type === 'M' ? 'FOLDER' : item.type === 'P' ? 'PROGRAM' : item.type === 'L' ? 'LINK' : 'DATA_VIEW',
      icon: item.icon,
      href: item.href,
      orderIndex: index * 10,
      isVisible: item.isVisible,
      roles: item.requiredRoles || [],
      children: item.children ? convertToApiFormat(item.children) : [],
    }))
  }

  // Toggle item expansion
  const toggleExpand = (itemId: string) => {
    setMenuItems(prev => updateItemInTree(prev, itemId, item => ({
      ...item,
      isExpanded: !item.isExpanded,
    })))
  }

  // Update item in tree helper
  const updateItemInTree = (
    items: MenuItemEdit[],
    itemId: string,
    updater: (item: MenuItemEdit) => MenuItemEdit
  ): MenuItemEdit[] => {
    return items.map(item => {
      if (item.id === itemId) {
        return updater(item)
      }
      if (item.children?.length) {
        return {
          ...item,
          children: updateItemInTree(item.children, itemId, updater),
        }
      }
      return item
    })
  }

  // Delete item from tree
  const deleteItemFromTree = (items: MenuItemEdit[], itemId: string): MenuItemEdit[] => {
    return items
      .filter(item => item.id !== itemId)
      .map(item => ({
        ...item,
        children: item.children ? deleteItemFromTree(item.children, itemId) : [],
      }))
  }

  // Move item up/down
  const moveItem = (itemId: string, direction: 'up' | 'down'): void => {
    setMenuItems(prev => moveItemInArray(prev, itemId, direction))
    setHasChanges(true)
  }

  const moveItemInArray = (items: MenuItemEdit[], itemId: string, direction: 'up' | 'down'): MenuItemEdit[] => {
    const index = items.findIndex(item => item.id === itemId)
    if (index === -1) {
      // Not found at this level, search in children
      return items.map(item => ({
        ...item,
        children: item.children?.length
          ? moveItemInArray(item.children, itemId, direction)
          : [],
      }))
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return items

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    return newItems
  }

  // Handle add item
  const handleAddItem = (newItem: Omit<MenuItemEdit, 'id' | 'children'>) => {
    const itemWithId: MenuItemEdit = {
      ...newItem,
      id: `new-${Date.now()}`,
      children: [],
    }

    if (parentItemId) {
      // Add as child
      setMenuItems(prev => updateItemInTree(prev, parentItemId, parent => ({
        ...parent,
        children: [...(parent.children || []), itemWithId],
        isExpanded: true,
      })))
    } else {
      // Add to root
      setMenuItems(prev => [...prev, itemWithId])
    }

    setHasChanges(true)
    setIsAddDialogOpen(false)
    setParentItemId(null)
  }

  // Handle edit item
  const handleEditItem = (updatedItem: MenuItemEdit) => {
    setMenuItems(prev => updateItemInTree(prev, updatedItem.id, () => updatedItem))
    setHasChanges(true)
    setIsEditDialogOpen(false)
    setSelectedItem(null)
  }

  // Handle delete item
  const handleDeleteItem = (itemId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      setMenuItems(prev => deleteItemFromTree(prev, itemId))
      setHasChanges(true)
    }
  }

  if (loading) {
    return (
      <PageContainer maxWidth="full" padding="default">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    )
  }

  return (
    <TooltipProvider>
      <PageContainer maxWidth="full" padding="default">
        <PageHeader
          title={`Édition: ${config?.name || 'Configuration'}`}
          description="Modifiez la structure du menu en ajoutant, supprimant ou réorganisant les éléments."
          icon={Edit3}
          iconBackground="bg-gradient-to-br from-purple-500 to-pink-600"
          actions={
            <div className="flex items-center gap-2">
              <Link href="/admin/menu-config">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          }
        />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasChanges && (
          <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Vous avez des modifications non enregistrées.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Tree Editor */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Structure du menu</CardTitle>
                  <CardDescription>
                    Glissez pour réorganiser, cliquez pour modifier
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setParentItemId(null)
                    setIsAddDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                {menuItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun élément dans ce menu</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter le premier élément
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {menuItems.map((item, index) => (
                      <MenuItemRow
                        key={item.id}
                        item={item}
                        depth={0}
                        index={index}
                        totalItems={menuItems.length}
                        onToggle={() => toggleExpand(item.id)}
                        onEdit={() => {
                          setSelectedItem(item)
                          setIsEditDialogOpen(true)
                        }}
                        onDelete={() => handleDeleteItem(item.id)}
                        onMoveUp={() => moveItem(item.id, 'up')}
                        onMoveDown={() => moveItem(item.id, 'down')}
                        onAddChild={() => {
                          setParentItemId(item.id)
                          setIsAddDialogOpen(true)
                        }}
                        onChildToggle={(itemId) => toggleExpand(itemId)}
                        onChildEdit={(childItem) => {
                          setSelectedItem(childItem)
                          setIsEditDialogOpen(true)
                        }}
                        onChildDelete={(itemId) => handleDeleteItem(itemId)}
                        onChildMoveUp={(itemId) => moveItem(itemId, 'up')}
                        onChildMoveDown={(itemId) => moveItem(itemId, 'down')}
                        onChildAddChild={(parentId) => {
                          setParentItemId(parentId)
                          setIsAddDialogOpen(true)
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nom</Label>
                  <p className="font-medium">{config?.name}</p>
                </div>
                {config?.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm">{config.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {config?.isActive && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      Active
                    </Badge>
                  )}
                  {config?.isSystem && (
                    <Badge variant="secondary">Système</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Légende</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {MENU_TYPES.map(type => (
                  <div key={type.value} className="flex items-center gap-2">
                    <Badge variant="outline" className="w-8 justify-center">
                      {type.value}
                    </Badge>
                    <span>{type.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un élément</DialogTitle>
              <DialogDescription>
                {parentItemId ? 'Ajouter un sous-élément' : 'Ajouter un élément au menu principal'}
              </DialogDescription>
            </DialogHeader>
            <MenuItemForm
              onSave={handleAddItem}
              onCancel={() => {
                setIsAddDialogOpen(false)
                setParentItemId(null)
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier l'élément</DialogTitle>
              <DialogDescription>
                Modifiez les propriétés de cet élément de menu.
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <MenuItemForm
                initialData={selectedItem}
                onSave={(data) => handleEditItem({ ...selectedItem, ...data })}
                onCancel={() => {
                  setIsEditDialogOpen(false)
                  setSelectedItem(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </PageContainer>
    </TooltipProvider>
  )
}

// Menu Item Row Component
function MenuItemRow({
  item,
  depth,
  index,
  totalItems,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddChild,
  onChildToggle,
  onChildEdit,
  onChildDelete,
  onChildMoveUp,
  onChildMoveDown,
  onChildAddChild,
}: {
  item: MenuItemEdit
  depth: number
  index: number
  totalItems: number
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddChild: () => void
  onChildToggle?: (itemId: string) => void
  onChildEdit?: (item: MenuItemEdit) => void
  onChildDelete?: (itemId: string) => void
  onChildMoveUp?: (itemId: string) => void
  onChildMoveDown?: (itemId: string) => void
  onChildAddChild?: (parentId: string) => void
}) {
  const hasChildren = item.children && item.children.length > 0

  return (
    <>
      <div
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group ${
          depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''
        }`}
      >
        {/* Expand/Collapse */}
        {item.type === 'M' ? (
          <button
            type="button"
            onClick={onToggle}
            className="p-1 hover:bg-muted rounded"
          >
            {item.isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Icon */}
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          item.isVisible ? 'bg-primary/10' : 'bg-muted'
        }`}>
          {getMenuIcon(item.icon, item.isVisible)}
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${!item.isVisible ? 'text-muted-foreground line-through' : ''}`}>
              {item.title}
            </span>
            <Badge variant="outline" className="text-xs">
              {item.type}
            </Badge>
            {item.requiredRoles && item.requiredRoles.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {item.requiredRoles.length}
              </Badge>
            )}
          </div>
          {item.href && (
            <p className="text-xs text-muted-foreground truncate">{item.href}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={index === 0}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Monter</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={index === totalItems - 1}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Descendre</TooltipContent>
          </Tooltip>

          {item.type === 'M' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddChild}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajouter sous-élément</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modifier</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Children */}
      {hasChildren && item.isExpanded && (
        <div className="ml-4">
          {item.children.map((child, idx) => (
            <MenuItemRow
              key={child.id}
              item={child}
              depth={depth + 1}
              index={idx}
              totalItems={item.children.length}
              onToggle={() => onChildToggle?.(child.id)}
              onEdit={() => onChildEdit?.(child)}
              onDelete={() => onChildDelete?.(child.id)}
              onMoveUp={() => onChildMoveUp?.(child.id)}
              onMoveDown={() => onChildMoveDown?.(child.id)}
              onAddChild={() => onChildAddChild?.(child.id)}
              onChildToggle={onChildToggle}
              onChildEdit={onChildEdit}
              onChildDelete={onChildDelete}
              onChildMoveUp={onChildMoveUp}
              onChildMoveDown={onChildMoveDown}
              onChildAddChild={onChildAddChild}
            />
          ))}
        </div>
      )}
    </>
  )
}

// Menu Item Form Component
function MenuItemForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: Partial<MenuItemEdit>
  onSave: (data: Omit<MenuItemEdit, 'id' | 'children'>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    type: initialData?.type || 'P' as 'M' | 'P' | 'L' | 'D',
    icon: initialData?.icon || 'Home',
    href: initialData?.href || '',
    isVisible: initialData?.isVisible ?? true,
    requiredRoles: initialData?.requiredRoles || [],
    orderIndex: initialData?.orderIndex || 0,
  })

  const titleId = useUniqueId('title')
  const hrefId = useUniqueId('href')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      requiredRoles: prev.requiredRoles.includes(role)
        ? prev.requiredRoles.filter(r => r !== role)
        : [...prev.requiredRoles, role],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={titleId}>Titre *</Label>
        <Input
          id={titleId}
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Titre de l'élément"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: 'M' | 'P' | 'L' | 'D') => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MENU_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Icône</Label>
          <Select
            value={formData.icon}
            onValueChange={(value: string) => setFormData(prev => ({ ...prev, icon: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ICONS.map(icon => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.type !== 'M' && (
        <div className="space-y-2">
          <Label htmlFor={hrefId}>
            {formData.type === 'L' ? 'URL externe' : 'Chemin de la page'}
          </Label>

          {formData.type === 'L' ? (
            // Lien externe - input libre
            <Input
              id={hrefId}
              value={formData.href}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, href: e.target.value }))}
              placeholder="https://example.com"
            />
          ) : (
            // Routes internes - sélecteur avec liste
            <div className="space-y-2">
              <Select
                value={formData.href}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, href: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une page..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(ROUTES_BY_CATEGORY).map(([category, routes]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {category}
                      </div>
                      {routes.map(route => (
                        <SelectItem key={route.path} value={route.path}>
                          <div className="flex flex-col">
                            <span>{route.label}</span>
                            <span className="text-xs text-muted-foreground">{route.path}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {/* Description de la route sélectionnée */}
              {formData.href && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                  {AVAILABLE_ROUTES.find(r => r.path === formData.href)?.description || 'Route personnalisée'}
                </div>
              )}

              {/* Option pour chemin personnalisé */}
              <div className="flex items-center gap-2">
                <Input
                  id={hrefId}
                  value={formData.href}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, href: e.target.value }))}
                  placeholder="Ou saisir un chemin personnalisé..."
                  className="text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label>Visible</Label>
        <Switch
          checked={formData.isVisible}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Rôles requis</Label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_ROLES.map(role => (
            <Badge
              key={role}
              variant={formData.requiredRoles.includes(role) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleRole(role)}
            >
              {role}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Cliquez pour sélectionner les rôles. Vide = accessible à tous.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={!formData.title.trim()}>
          <Check className="h-4 w-4 mr-2" />
          {initialData ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Icon helper
function getMenuIcon(iconName?: string, isVisible: boolean = true) {
  const className = `h-4 w-4 ${isVisible ? 'text-primary' : 'text-muted-foreground'}`

  switch (iconName?.toLowerCase()) {
    case 'home': return <Home className={className} />
    case 'search': return <Search className={className} />
    case 'settings': return <Settings className={className} />
    case 'shield': return <Shield className={className} />
    case 'menu': return <Menu className={className} />
    case 'folder': return <Folder className={className} />
    case 'externallink': return <ExternalLink className={className} />
    default: return <Folder className={className} />
  }
}
