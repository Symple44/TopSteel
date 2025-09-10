'use client'

import { Dialog, DialogContent, DialogTitle } from '@erp/ui'
import DOMPurify from 'dompurify'
import {
  ArrowRight,
  Bell,
  Building,
  Calculator,
  Clock,
  Database,
  FileText,
  Folder,
  Hash,
  Layers,
  Menu,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Sparkles,
  Truck,
  User,
  Users,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { type SearchResult, useGlobalSearch } from '@/hooks/use-global-search'
import { cn } from '@/lib/utils'

// Mapping des types vers les icônes
const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  menu: Menu,
  client: Users,
  fournisseur: Truck,
  article: Package,
  material: Layers,
  shared_material: Layers,
  projet: Folder,
  devis: FileText,
  facture: Receipt,
  commande: ShoppingCart,
  user: User,
  societe: Building,
  price_rule: Calculator,
  notification: Bell,
  query: Database,
}

// Mapping des types vers les labels
const TYPE_LABELS: Record<string, string> = {
  menu: 'Menu',
  client: 'Client',
  fournisseur: 'Fournisseur',
  article: 'Article',
  material: 'Matériau',
  shared_material: 'Matériau partagé',
  projet: 'Projet',
  devis: 'Devis',
  facture: 'Facture',
  commande: 'Commande',
  user: 'Utilisateur',
  societe: 'Société',
  price_rule: 'Règle tarifaire',
  notification: 'Notification',
  query: 'Requête',
}

// Couleurs par type avec styles modernes
const TYPE_COLORS: Record<string, string> = {
  menu: 'text-blue-700 bg-gradient-to-br from-blue-500/10 to-blue-600/10',
  client: 'text-emerald-700 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10',
  fournisseur: 'text-orange-700 bg-gradient-to-br from-orange-500/10 to-orange-600/10',
  article: 'text-purple-700 bg-gradient-to-br from-purple-500/10 to-purple-600/10',
  material: 'text-indigo-700 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10',
  shared_material: 'text-cyan-700 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10',
  projet: 'text-amber-700 bg-gradient-to-br from-amber-500/10 to-amber-600/10',
  devis: 'text-pink-700 bg-gradient-to-br from-pink-500/10 to-pink-600/10',
  facture: 'text-red-700 bg-gradient-to-br from-red-500/10 to-red-600/10',
  commande: 'text-teal-700 bg-gradient-to-br from-teal-500/10 to-teal-600/10',
  user: 'text-slate-700 bg-gradient-to-br from-slate-500/10 to-slate-600/10',
  societe: 'text-sky-700 bg-gradient-to-br from-sky-500/10 to-sky-600/10',
  price_rule: 'text-violet-700 bg-gradient-to-br from-violet-500/10 to-violet-600/10',
  notification: 'text-yellow-700 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10',
  query: 'text-gray-700 bg-gradient-to-br from-gray-500/10 to-gray-600/10',
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  // const { t } = useTranslation('common') // Unused for now
  const [selectedTab, setSelectedTab] = useState<string | null>(null)

  const {
    query,
    results,
    loading,
    error,
    suggestions,
    searchEngine,
    searchTime,
    total,
    history,
    selectedIndex,
    setQuery,
    clearSearch,
    searchFromHistory,
    handleKeyDown,
    getGroupedResults,
    getResultCountByType,
    searchInputRef,
  } = useGlobalSearch({
    limit: 30,
    autoFocus: true,
    minChars: 2,
    debounceMs: 300,
  })

  // Grouper les résultats par type
  const groupedResults = getGroupedResults()
  const types = Object.keys(groupedResults)

  // Gestion de la navigation clavier
  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
    return undefined
  }, [open, handleKeyDown])

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
    return undefined
  }, [open, onOpenChange])

  // Réinitialiser quand on ferme
  useEffect(() => {
    if (!open) {
      clearSearch()
      setSelectedTab(null)
    }
  }, [open, clearSearch])

  // Navigation vers un résultat
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      if (result.url) {
        onOpenChange(false)

        if (result?.url?.startsWith('http')) {
          window.open(result.url, '_blank')
        } else {
          router?.push(result.url)
        }
      }
    },
    [router, onOpenChange]
  )

  // Obtenir l'icône pour un type
  const getIcon = (type: string) => {
    const Icon = TYPE_ICONS[type] || Hash
    return Icon
  }

  // Obtenir les résultats filtrés
  const getFilteredResults = () => {
    if (!selectedTab) return results
    return results?.filter((r) => r.type === selectedTab)
  }

  const filteredResults = getFilteredResults()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border rounded-lg shadow-xl">
        <DialogTitle className="sr-only">Recherche globale</DialogTitle>
        {/* Header avec input de recherche */}
        <div className="border-b bg-muted/30">
          <div className="flex items-center px-4 py-4">
            <Search className="mr-3 h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e?.target?.value)}
              placeholder="Rechercher clients, articles, projets..."
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-base"
              autoFocus
            />
            {loading && (
              <div className="ml-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {searchEngine === 'elasticsearch' && (
              <div className="ml-3 flex items-center gap-1 px-2 py-1 bg-yellow-500/10 rounded-md">
                <Zap className="h-3 w-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-600">Elastic</span>
              </div>
            )}
          </div>

          {/* Tabs pour filtrer par type */}
          {types?.length > 1 && (
            <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
              <button
                onClick={() => setSelectedTab(null)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                  selectedTab
                    ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    : 'bg-primary text-primary-foreground'
                )}
              >
                Tout ({total})
              </button>
              {types?.map((type) => {
                const count = getResultCountByType(type)
                const Icon = getIcon(type)

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedTab(type)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                      selectedTab === type
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {TYPE_LABELS[type]} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Corps avec résultats */}
        <div className="max-h-[420px] overflow-y-auto bg-background">
          {/* Message d'erreur */}
          {error && <div className="p-4 text-sm text-destructive">{error}</div>}

          {/* Pas de résultats */}
          {!loading && query && filteredResults?.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">Aucun résultat trouvé</p>
              <p className="text-sm text-muted-foreground">pour "{query}"</p>
            </div>
          )}

          {/* Historique de recherche (quand pas de query) */}
          {!query && history.length > 0 && (
            <div className="p-3">
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recherches récentes
              </div>
              {history?.slice(0, 5).map((item, index) => (
                <button
                  key={index}
                  onClick={() => searchFromHistory(item)}
                  className="flex items-center w-full px-3 py-2.5 text-sm hover:bg-accent rounded-lg transition-colors"
                >
                  <Clock className="mr-3 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left font-medium">{item.query}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {item.resultCount}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Résultats de recherche */}
          {filteredResults?.length > 0 && (
            <div className="p-3">
              {selectedTab
                ? // Vue filtrée par type
                  filteredResults?.map((result, index) => {
                    const typeColor = TYPE_COLORS[result.type] || 'text-gray-600 bg-gray-50'

                    return (
                      <SearchResultItem
                        key={`${result.type}-${result.id}`}
                        result={result}
                        isSelected={selectedIndex === index}
                        onClick={() => navigateToResult(result)}
                        typeColor={typeColor}
                      />
                    )
                  })
                : // Vue groupée par type
                  types?.map((type) => {
                    const typeResults = groupedResults?.[type]?.slice(0, 5)
                    const Icon = getIcon(type)
                    const typeColor = TYPE_COLORS[type] || 'text-gray-600 bg-gray-50'

                    return (
                      <div key={type} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between px-2 py-2">
                          <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <Icon className="mr-2 h-4 w-4" />
                            {TYPE_LABELS[type]}
                          </div>
                          {groupedResults?.[type]?.length > 5 && (
                            <button
                              onClick={() => setSelectedTab(type)}
                              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                              Voir tout ({groupedResults?.[type]?.length})
                            </button>
                          )}
                        </div>

                        {typeResults?.map((result, _index) => (
                          <SearchResultItem
                            key={`${result.type}-${result.id}`}
                            result={result}
                            isSelected={selectedIndex === results?.indexOf(result)}
                            onClick={() => navigateToResult(result)}
                            typeColor={typeColor}
                          />
                        ))}
                      </div>
                    )
                  })}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-t p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Suggestions
              </div>
              {suggestions?.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(suggestion)}
                  className="flex items-center w-full px-2 py-2 text-sm hover:bg-muted rounded-md"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer avec infos */}
        {results.length > 0 && (
          <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {total} résultat{total > 1 ? 's' : ''} en {searchTime}ms
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
                <span>Naviguer</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
                <span>Sélectionner</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
                <span>Fermer</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Composant pour un résultat de recherche
interface SearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
  typeColor: string
}

function SearchResultItem({ result, isSelected, onClick, typeColor }: SearchResultItemProps) {
  const Icon = TYPE_ICONS[result.type] || Hash

  // Fonction pour rendre le texte avec highlighting
  const renderHighlighted = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text

    // Pour simplifier, on prend juste le premier highlight
    const highlighted = highlights?.[0]

    // Sanitize HTML content to prevent XSS attacks from search highlights
    const sanitizedHTML = DOMPurify?.sanitize(highlighted, {
      ALLOWED_TAGS: ['mark', 'strong', 'em', 'span'],
      ALLOWED_ATTR: ['class'],
      KEEP_CONTENT: true,
    })

    // Using dangerouslySetInnerHTML is necessary here to render search highlights from the API
    // Content is sanitized with DOMPurify to prevent XSS vulnerabilities
    return <span dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center w-full px-3 py-3 text-sm rounded-lg transition-all duration-200',
        isSelected ? 'bg-accent shadow-sm scale-[1.02]' : 'hover:bg-accent/50'
      )}
    >
      <div className={cn('mr-3 p-2 rounded-lg', typeColor)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 text-left">
        <div className="font-semibold text-foreground">
          {result.highlight?.title
            ? renderHighlighted(result.title, result?.highlight?.title)
            : result.title}
        </div>
        {result.description && (
          <div className="text-xs text-muted-foreground line-clamp-1">
            {result.highlight?.description
              ? renderHighlighted(result.description, result?.highlight?.description)
              : result.description}
          </div>
        )}
      </div>

      {result.metadata && (
        <div className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
          {result?.metadata?.statut && (
            <span className="px-1.5 py-0.5 bg-muted rounded">
              {result?.metadata?.statut as string}
            </span>
          )}
          {result?.metadata?.montant && (
            <span className="font-medium">{result?.metadata?.montant as string}€</span>
          )}
        </div>
      )}

      <ArrowRight className="ml-2 h-3 w-3 text-muted-foreground" />
    </button>
  )
}
