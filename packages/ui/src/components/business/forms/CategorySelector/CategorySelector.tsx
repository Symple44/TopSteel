'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Search, Folder, FolderOpen, Check, Plus, AlertCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Input } from '../../../primitives/input/Input'
import { Button } from '../../../primitives/button/Button'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string
  children?: Category[]
  description?: string
  icon?: string
  color?: string
  itemCount?: number
  isActive?: boolean
  path?: string[]
  level?: number
}
interface CategorySelectorProps {
  value?: string
  onChange?: (value: string, category: Category | null) => void
  categories?: Category[]
  onCategoryCreate?: (name: string, parentId?: string) => void
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  placeholder?: string
  showSearch?: boolean
  showCreateButton?: boolean
  showItemCount?: boolean
  showPath?: boolean
  expandAll?: boolean
  maxDepth?: number
  className?: string
}
export function CategorySelector({
  value,
  onChange,
  categories = [],
  onCategoryCreate,
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  placeholder = "Sélectionner une catégorie...",
  showSearch = true,
  showCreateButton = false,
  showItemCount = true,
  showPath = true,
  expandAll = false,
  maxDepth,
  className,
}: CategorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryParent, setNewCategoryParent] = useState<string | undefined>()
  useEffect(() => {
    if (expandAll) {
      const allIds = new Set<string>()
      const addAllIds = (cats: Category[]) => {
        cats.forEach(cat => {
          allIds.add(cat.id)
          if (cat.children) {
            addAllIds(cat.children)
          }
        })
      }
      addAllIds(categories)
      setExpandedNodes(allIds)
    }
  }, [categories, expandAll])
  useEffect(() => {
    if (value) {
      const category = findCategoryById(categories, value)
      setSelectedCategory(category)
    } else {
      setSelectedCategory(null)
    }
  }, [value, categories])
  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const category of cats) {
      if (category.id === id) {
        return category
      }
      if (category.children) {
        const found = findCategoryById(category.children, id)
        if (found) return found
      }
    }
    return null
  }
  const buildCategoryPath = (cats: Category[], targetId: string, path: string[] = []): string[] | null => {
    for (const category of cats) {
      const currentPath = [...path, category.name]
      if (category.id === targetId) {
        return currentPath
      }
      if (category.children) {
        const found = buildCategoryPath(category.children, targetId, currentPath)
        if (found) return found
      }
    }
    return null
  }
  const filterCategories = (cats: Category[], query: string): Category[] => {
    if (!query) return cats
    return cats.reduce((filtered: Category[], category) => {
      const matchesQuery = category.name.toLowerCase().includes(query.toLowerCase()) ||
                          category.description?.toLowerCase().includes(query.toLowerCase())
      const filteredChildren = category.children ? filterCategories(category.children, query) : []
      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...category,
          children: filteredChildren.length > 0 ? filteredChildren : category.children,
        })
      }
      return filtered
    }, [])
  }
  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
    onChange?.(category.id, category)
    setIsDropdownOpen(false)
  }
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !onCategoryCreate) return
    try {
      await onCategoryCreate(newCategoryName.trim(), newCategoryParent)
      setNewCategoryName('')
      setNewCategoryParent(undefined)
      setIsCreatingCategory(false)
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }
  const renderCategoryTree = (cats: Category[], level = 0) => {
    if (maxDepth && level >= maxDepth) return null
    return cats.map((category) => {
      const isExpanded = expandedNodes.has(category.id)
      const hasChildren = category.children && category.children.length > 0
      const isSelected = selectedCategory?.id === category.id
      return (
        <div key={category.id} className="select-none">
          <div
            className={cn(
              'flex items-center gap-2 py-2 px-3 hover:bg-muted cursor-pointer transition-colors',
              isSelected && 'bg-blue-50 border-l-2 border-l-blue-500',
              level > 0 && 'ml-6'
            )}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {/* Expand/collapse button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                if (hasChildren) {
                  toggleExpanded(category.id)
                }
              }}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3" />
              )}
            </Button>
            {/* Category icon */}
            <div className="flex items-center gap-2 flex-1" onClick={() => handleCategorySelect(category)}>
              {hasChildren ? (
                isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-muted" style={{ backgroundColor: category.color }} />
              )}
              <span className={cn('text-sm', isSelected && 'font-medium')}>
                {category.name}
              </span>
              {isSelected && <Check className="h-4 w-4 text-blue-600" />}
              {showItemCount && category.itemCount !== undefined && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {category.itemCount}
                </Badge>
              )}
            </div>
          </div>
          {/* Children */}
          {hasChildren && isExpanded && (
            <div>
              {renderCategoryTree(category.children!, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }
  const filteredCategories = filterCategories(categories, searchQuery)
  const categoryPath = selectedCategory ? buildCategoryPath(categories, selectedCategory.id) : null
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="category-selector">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Button
          id="category-selector"
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between',
            error && 'border-red-500',
            !selectedCategory && 'text-muted-foreground'
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedCategory ? selectedCategory.name : placeholder}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isDropdownOpen && 'rotate-180')} />
        </Button>
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search */}
            {showSearch && (
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une catégorie..."
                    className="pl-10 h-9"
                  />
                </div>
              </div>
            )}
            {/* Categories tree */}
            <div className="overflow-auto max-h-60">
              {filteredCategories.length > 0 ? (
                renderCategoryTree(filteredCategories)
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  {searchQuery ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
                </div>
              )}
            </div>
            {/* Create category */}
            {showCreateButton && onCategoryCreate && (
              <div className="border-t">
                {!isCreatingCategory ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setIsCreatingCategory(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une nouvelle catégorie
                  </Button>
                ) : (
                  <div className="p-3 space-y-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nom de la catégorie..."
                      className="h-9"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim()}
                      >
                        Créer
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsCreatingCategory(false)
                          setNewCategoryName('')
                          setNewCategoryParent(undefined)
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Category path */}
      {showPath && categoryPath && categoryPath.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Chemin:</span>
          {categoryPath.map((segment, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <span>/</span>}
              <span>{segment}</span>
            </span>
          ))}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
