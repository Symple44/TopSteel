'use client'

import { useState } from 'react'
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
  X
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useUserMenuPreferences } from '@/hooks/use-user-menu-preferences'
import { useAvailablePages } from '@/hooks/use-available-pages'
import { useSelectedPages } from '@/hooks/use-selected-pages'
import { useDynamicMenu } from '@/hooks/use-dynamic-menu'

export default function MenuSettingsPage() {
  const { 
    loading, 
    error, 
    resetPreferences
  } = useUserMenuPreferences()

  const { 
    categories, 
    loading: pagesLoading,
    searchPages 
  } = useAvailablePages()

  const {
    selectedPages,
    loading: selectedLoading,
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

  const breadcrumbItems = [
    { title: 'Paramètres', href: '/settings' },
    { title: 'Personnalisation du menu', current: true }
  ]

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
      await resetPreferences()
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

  if (loading || pagesLoading || selectedLoading) {
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
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Personnalisation du Menu
          </h1>
          <p className="text-muted-foreground mt-2">
            Sélectionnez les pages que vous souhaitez voir apparaître dans votre menu personnalisé
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Informations sur la sauvegarde automatique */}
      <Alert>
        <AlertDescription className="flex items-center justify-between">
          <span>✅ Les modifications sont automatiquement sauvegardées et le menu mis à jour en temps réel</span>
          <Badge variant="secondary">{selectedCount} pages sélectionnées</Badge>
        </AlertDescription>
      </Alert>

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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
    </div>
  )
}

