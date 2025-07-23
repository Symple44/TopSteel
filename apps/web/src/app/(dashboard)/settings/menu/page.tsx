'use client'

import React, { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Checkbox,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { 
  Settings,
  Eye,
  EyeOff,
  Star,
  Pin,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Factory,
  TrendingUp,
  CreditCard,
  UserCheck,
  FileBarChart,
  LayoutDashboard,
  Save,
  RotateCcw,
  Check,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Palette,
  List
} from 'lucide-react'
import { useAvailablePages } from '@/hooks/use-available-pages'
import { useSelectedPages } from '@/hooks/use-selected-pages'
import { useDynamicMenu } from '@/hooks/use-dynamic-menu'
import { ReorderableList } from '@/components/ui/reorderable-list'
import { cn } from '@/lib/utils'

// Mapping des icônes
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Settings,
  Package,
  Factory,
  TrendingUp,
  CreditCard,
  UserCheck,
  FileBarChart,
  dashboard: LayoutDashboard,
  admin: Settings,
  company: Package,
  roles: UserCheck,
  database: FileBarChart,
}

// Interface pour les éléments de menu
interface MenuItem {
  id: string
  title: string
  href?: string
  icon?: string
  gradient?: string
  orderIndex: number
  isVisible: boolean
  parentId?: string
  children?: MenuItem[]
  userPreferences?: {
    customTitle?: string
    isFavorite?: boolean
  }
}

// Composant moderne pour l'affichage d'un élément de menu
function MenuItemDisplay({ item, onToggleVisibility }: { 
  item: MenuItem
  onToggleVisibility: (id: string) => void 
}) {
  const IconComponent = item.icon ? iconMap[item.icon] || LayoutDashboard : LayoutDashboard

  return (
    <div className="flex items-center gap-3 w-full py-1 px-2 group rounded-md hover:bg-accent/10 transition-colors duration-200">
      {/* Icône avec gradient et effets */}
      <div className={cn(
        'flex items-center justify-center rounded-lg h-8 w-8 flex-shrink-0',
        'transition-all duration-200 ease-out',
        'hover:scale-110 hover:shadow-lg',
        item.gradient
          ? `bg-gradient-to-br ${item.gradient} text-white shadow-md`
          : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30'
      )}>
        <IconComponent className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground truncate transition-all duration-200 group-hover:text-primary">
            {item.userPreferences?.customTitle || item.title}
          </h3>
          
          {/* Badges modernes */}
          {item.children && item.children.length > 0 && (
            <Badge variant="outline" className="h-5 px-2 text-xs bg-primary/5 text-primary border-primary/20">
              {item.children.length}
            </Badge>
          )}
          {item.userPreferences?.isFavorite && (
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          )}
        </div>
        
        {item.href && (
          <p className="text-xs text-muted-foreground/80 truncate mt-0.5 font-mono">
            {item.href}
          </p>
        )}
      </div>

      {/* Toggle moderne */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()
          onToggleVisibility(item.id)
        }}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
        className={cn(
          'h-8 w-8 p-0 shrink-0 rounded-lg transition-all duration-200 ease-out',
          'hover:scale-110 active:scale-95 hover:shadow-md',
          item.isVisible
            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50 border border-emerald-200/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border'
        )}
      >
        {item.isVisible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

// Composant de carte pour l'organisation du menu
function MenuOrderingCard() {
  const { customMenu, standardMenu, currentMode, refreshMenu } = useDynamicMenu()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Convertir le menu en format compatible
  const convertToMenuItems = (menu: any[]): MenuItem[] => {
    return menu.map((item, index) => ({
      id: item.id || `item-${index}`,
      title: item.title,
      href: item.href,
      icon: item.icon,
      gradient: item.gradient,
      orderIndex: item.orderIndex ?? index,
      isVisible: item.isVisible ?? true,
      parentId: item.parentId,
      children: item.children ? convertToMenuItems(item.children) : undefined,
      userPreferences: item.userPreferences,
    }))
  }

  // Charger le menu actuel
  React.useEffect(() => {
    const currentMenuData = currentMode === 'custom' ? customMenu : standardMenu
    if (currentMenuData && currentMenuData.length > 0) {
      const converted = convertToMenuItems(currentMenuData)
      const sorted = [...converted].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      setMenuItems(sorted)
      setHasChanges(false)
    }
  }, [customMenu, standardMenu, currentMode])

  // Gérer les changements d'ordre
  const handleItemsChange = (newItems: MenuItem[]) => {
    const updateOrderIndex = (items: MenuItem[], startIndex = 0): MenuItem[] => {
      return items.map((item, index) => ({
        ...item,
        orderIndex: startIndex + index,
        children: item.children ? updateOrderIndex(item.children, 0) : undefined
      }))
    }

    const updatedItems = updateOrderIndex(newItems)
    setMenuItems(updatedItems)
    setHasChanges(true)
  }

  // Basculer la visibilité
  const handleToggleVisibility = (id: string) => {
    const toggleInItems = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, isVisible: !item.isVisible }
        }
        if (item.children) {
          return { ...item, children: toggleInItems(item.children) }
        }
        return item
      })
    }

    const updatedItems = toggleInItems(menuItems)
    setMenuItems(updatedItems)
    setHasChanges(true)
  }

  // Sauvegarder
  const handleSave = async (items: MenuItem[]) => {
    setSaving(true)
    try {
      const menuData = items.map((item, index) => ({
        id: item.id,
        title: item.title,
        href: item.href,
        icon: item.icon,  
        gradient: item.gradient,
        orderIndex: index,
        isVisible: item.isVisible,
        parentId: item.parentId,
        children: item.children || [],
        userPreferences: item.userPreferences || {}
      }))

      const response = await fetch('/api/user/menu-preferences/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ menuItems: menuData }),
      })

      if (response.ok) {
        setHasChanges(false)
        await refreshMenu()
      }
    } catch (error) {
      // Gérer l'erreur silencieusement
    } finally {
      setSaving(false)
    }
  }

  if (menuItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <List className="h-8 w-8 mx-auto mb-3" />
            <p>Aucun élément de menu à organiser</p>
            <p className="text-sm mt-2">
              Sélectionnez d'abord des pages dans l'onglet "Sélection des pages"
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header moderne */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-primary/70" />
            Ordre d'affichage
          </h2>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span>Glissez-déposez pour réorganiser • Mode:</span>
            <Badge variant="outline">{currentMode === 'custom' ? 'Personnalisé' : 'Standard'}</Badge>
          </div>
        </div>
      </div>

      {/* Alert moderne */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Modifications non sauvegardées - Cliquez sur "Sauvegarder" pour les appliquer
          </div>
        </div>
      )}

      {/* Liste moderne */}
      <div className="bg-card border border-border/50 rounded-lg p-4">
        
        <ReorderableList
          items={menuItems}
          onItemsChange={handleItemsChange}
          onSave={handleSave}
          renderItem={({ item }) => (
            <MenuItemDisplay 
              item={item} 
              onToggleVisibility={handleToggleVisibility} 
            />
          )}
        />
      </div>
    </div>
  )
}

export default function MenuSettingsPage() {
  const { 
    categories, 
    loading: pagesLoading,
    searchPages 
  } = useAvailablePages()

  const {
    selectedPages,
    loading: selectedLoading,
    error: selectedError,
    togglePage,
    selectAllPages,
    deselectAllPages,
    resetSelection,
    isSelected,
    selectedCount
  } = useSelectedPages()

  const { refreshMenu } = useDynamicMenu()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['dashboard']))


  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleTogglePage = async (pageId: string) => {
    console.log('[Settings] Toggle page:', pageId)
    await togglePage(pageId)
    // Mettre à jour le menu immédiatement
    console.log('[Settings] Appel refreshMenu')
    refreshMenu()
  }

  const handleSelectAll = async () => {
    const allPageIds = categories.flatMap(cat => cat.pages.map(page => page.id))
    await selectAllPages(allPageIds)
    // Mettre à jour le menu immédiatement
    refreshMenu()
  }

  const handleDeselectAll = async () => {
    await deselectAllPages()
    // Mettre à jour le menu immédiatement
    refreshMenu()
  }

  const handleReset = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes vos sélections ?')) {
      await resetSelection()
      // Mettre à jour le menu immédiatement
      refreshMenu()
    }
  }

  const filteredCategories = searchQuery 
    ? categories.map(category => ({
        ...category,
        pages: category.pages.filter(page => 
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.pages.length > 0)
    : categories

  if (pagesLoading || selectedLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Personnalisation du Menu
          </h1>
          <p className="text-muted-foreground mt-2">
            Personnalisez votre menu : sélectionnez les pages et organisez leur ordre d'affichage
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {selectedError && (
        <Alert variant="destructive">
          <AlertDescription>
            {selectedError}
          </AlertDescription>
        </Alert>
      )}

      {/* Informations sur la sauvegarde automatique */}
      <Alert>
        <AlertDescription className="flex items-center justify-between">
          <span>✅ Les modifications sont automatiquement sauvegardées et le menu mis à jour en temps réel</span>
          <Badge variant="secondary">{selectedCount} pages sélectionnées</Badge>
        </AlertDescription>
      </Alert>

      {/* Onglets pour les différentes vues */}
      <Tabs defaultValue="selection" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="selection" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Sélection des pages
          </TabsTrigger>
          <TabsTrigger value="ordering" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Ordre d'affichage
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="selection" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-12">
        {/* Panneau de recherche et statistiques */}
        <div className="lg:col-span-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Recherche et filtres</CardTitle>
              <CardDescription>
                Trouvez rapidement les pages à ajouter à votre menu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barre de recherche */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des pages..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Statistiques */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pages sélectionnées</span>
                  <Badge variant="secondary">{selectedCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pages disponibles</span>
                  <Badge variant="outline">
                    {categories.reduce((total, cat) => total + cat.pages.length, 0)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Catégories</span>
                  <Badge variant="outline">{categories.length}</Badge>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="space-y-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleSelectAll}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tout sélectionner
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleDeselectAll}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tout désélectionner
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Arbre des pages disponibles */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pages disponibles par catégorie</CardTitle>
              <CardDescription>
                Organisées par thématique pour faciliter la navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg overflow-hidden">
                    {/* En-tête de catégorie */}
                    <div 
                      className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex items-center space-x-3">
                          {category.icon && (
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{category.title}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {category.pages.filter(page => isSelected(page.id)).length} / {category.pages.length}
                      </Badge>
                    </div>

                    {/* Pages de la catégorie */}
                    {expandedCategories.has(category.id) && (
                      <div className="border-t bg-background">
                        {category.pages.map((page) => (
                          <div 
                            key={page.id}
                            className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={isSelected(page.id)}
                                onCheckedChange={() => handleTogglePage(page.id)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <div className="flex items-center space-x-3">
                                {page.icon && (
                                  <div className="h-6 w-6 rounded flex items-center justify-center bg-blue-50">
                                    <LayoutDashboard className="h-3 w-3 text-blue-600" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-sm">{page.title}</p>
                                  {page.description && (
                                    <p className="text-xs text-muted-foreground">{page.description}</p>
                                  )}
                                  <p className="text-xs text-blue-600 font-mono">{page.href}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {page.permissions && page.permissions.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Permissions
                                </Badge>
                              )}
                              {page.roles && page.roles.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Rôles
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {filteredCategories.length === 0 && searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p>Aucune page trouvée pour "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ordering" className="mt-6">
          <MenuOrderingCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

