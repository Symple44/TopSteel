'use client'
import { useState, useEffect } from 'react'
import { Check, ChevronDown, ChevronRight, X, Search, Folder, FolderOpen, Plus, AlertCircle } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Input } from '../../../primitives/input/Input'
import { Button } from '../../../primitives/button/Button'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
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
interface CategoriesMultiSelectProps {
  value?: string[]
  onChange?: (value: string[], categories: Category[]) => void
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
  showSelectedSummary?: boolean
  expandAll?: boolean
  maxSelections?: number
  allowParentSelection?: boolean
  cascadeSelection?: boolean
  className?: string
}
export function CategoriesMultiSelect({
  value = [],
  onChange,
  categories = [],
  onCategoryCreate,
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  placeholder = "Sélectionner des catégories...",
  showSearch = true,
  showCreateButton = false,
  showItemCount = true,
  showSelectedSummary = true,
  expandAll = false,
  maxSelections,
  allowParentSelection = true,
  cascadeSelection = false,
  className,
}: CategoriesMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(value))
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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
    setSelectedIds(new Set(value))
  }, [value])
  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const category of cats) {
      if (category.id === id) return category
      if (category.children) {
        const found = findCategoryById(category.children, id)
        if (found) return found
      }
    }
    return null
  }
  const getAllDescendants = (category: Category): string[] => {
    let descendants: string[] = []
    if (category.children) {
      category.children.forEach(child => {
        descendants.push(child.id)
        descendants = descendants.concat(getAllDescendants(child))
      })
    }
    return descendants
  }
  const getSelectedCategories = (): Category[] => {
    return Array.from(selectedIds).map(id => findCategoryById(categories, id)).filter(Boolean) as Category[]
  }
  const handleCategoryToggle = (categoryId: string, category: Category) => {
    if (maxSelections && !selectedIds.has(categoryId) && selectedIds.size >= maxSelections) {
      return
    }
    const newSelected = new Set(selectedIds)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
      if (cascadeSelection) {
        // Remove all descendants
        const descendants = getAllDescendants(category)
        descendants.forEach(id => newSelected.delete(id))
      }
    } else {
      newSelected.add(categoryId)
      if (cascadeSelection) {
        // Add all descendants
        const descendants = getAllDescendants(category)
        descendants.forEach(id => {
          if (!maxSelections || newSelected.size < maxSelections) {
            newSelected.add(id)
          }
        })
      }
    }
    setSelectedIds(newSelected)
    const selectedCategories = getSelectedCategories()
    onChange?.(Array.from(newSelected), selectedCategories)
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
  const filterCategories = (cats: Category[], query: string): Category[] => {
    if (!query) return cats
    return cats.reduce((filtered: Category[], category) => {
      const matchesQuery = category.name.toLowerCase().includes(query.toLowerCase())
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
  const clearSelection = () => {
    setSelectedIds(new Set())
    onChange?.([], [])
  }
  const selectAll = (cats: Category[]) => {
    const allIds = new Set<string>()
    const addAllIds = (categories: Category[]) => {
      categories.forEach(cat => {
        if (allowParentSelection || !cat.children || cat.children.length === 0) {
          allIds.add(cat.id)
        }
        if (cat.children) {
          addAllIds(cat.children)
        }
      })
    }
    addAllIds(cats)
    const limitedIds = maxSelections ? Array.from(allIds).slice(0, maxSelections) : Array.from(allIds)
    const newSelected = new Set(limitedIds)
    setSelectedIds(newSelected)
    const selectedCategories = getSelectedCategories()
    onChange?.(Array.from(newSelected), selectedCategories)
  }
  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map((category) => {
      const isExpanded = expandedNodes.has(category.id)
      const hasChildren = category.children && category.children.length > 0
      const isSelected = selectedIds.has(category.id)
      const canSelect = allowParentSelection || !hasChildren
      return (
        <div key={category.id} className="select-none">
          <div
            className={cn(
              'flex items-center gap-2 py-2 px-3 hover:bg-muted transition-colors',
              level > 0 && 'ml-4'
            )}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {/* Expand/collapse button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => hasChildren && toggleExpanded(category.id)}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
              ) : (
                <div className="h-3 w-3" />
              )}
            </Button>
            {/* Checkbox */}
            {canSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleCategoryToggle(category.id, category)}
                disabled={disabled || (maxSelections && !isSelected && selectedIds.size >= maxSelections)}
              />
            )}
            {/* Category info */}
            <div className="flex items-center gap-2 flex-1">
              {hasChildren ? (
                isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-muted" style={{ backgroundColor: category.color }} />
              )}
              <span className={cn('text-sm', isSelected && 'font-medium')}>
                {category.name}
              </span>
              {showItemCount && category.itemCount !== undefined && (
                <Badge variant="outline" className="text-xs">
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
  const selectedCategories = getSelectedCategories()
  const displayText = selectedIds.size === 0 ? placeholder :
    selectedIds.size === 1 ? selectedCategories[0]?.name || '1 catégorie' :
    `${selectedIds.size} catégories sélectionnées`
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {maxSelections && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.size}/{maxSelections}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between',
            error && 'border-red-500',
            selectedIds.size === 0 && 'text-muted-foreground'
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isDropdownOpen && 'rotate-180')} />
        </Button>
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Header with search and actions */}
            <div className="p-3 border-b space-y-2">
              {showSearch && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10 h-9"
                  />
                </div>
              )}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectAll(filteredCategories)}
                    disabled={disabled}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={disabled || selectedIds.size === 0}
                  >
                    Tout désélectionner
                  </Button>
                </div>
                {showCreateButton && onCategoryCreate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onCategoryCreate('Nouvelle catégorie')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
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
          </div>
        )}
      </div>
      {/* Selected categories summary */}
      {showSelectedSummary && selectedIds.size > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.slice(0, 5).map((category) => (
            <Badge key={category.id} variant="secondary" className="text-xs">
              {category.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-secondary-foreground/20"
                onClick={() => handleCategoryToggle(category.id, category)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {selectedCategories.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{selectedCategories.length - 5}
            </Badge>
          )}
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
