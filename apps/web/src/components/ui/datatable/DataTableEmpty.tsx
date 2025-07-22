'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@erp/ui'
import { Package, Plus, Search, X } from 'lucide-react'

interface DataTableEmptyProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  searchTerm?: string
  onClearSearch?: () => void
  className?: string
}

export function DataTableEmpty({ 
  title,
  description,
  action,
  searchTerm,
  onClearSearch,
  className 
}: DataTableEmptyProps) {
  const isSearchResult = Boolean(searchTerm)
  
  const defaultTitle = isSearchResult 
    ? `Aucun résultat pour "${searchTerm}"`
    : 'Aucune donnée à afficher'
    
  const defaultDescription = isSearchResult
    ? 'Essayez de modifier votre recherche ou supprimez les filtres.'
    : 'Il n\'y a actuellement aucune donnée dans ce tableau.'

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      'border rounded-lg bg-gray-50',
      className
    )}>
      <div className="mb-4">
        {isSearchResult ? (
          <Search className="h-12 w-12 text-gray-400 mx-auto" />
        ) : (
          <Package className="h-12 w-12 text-gray-400 mx-auto" />
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || defaultTitle}
      </h3>
      
      <p className="text-sm text-gray-600 mb-6 max-w-md">
        {description || defaultDescription}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {isSearchResult && onClearSearch && (
          <Button 
            onClick={onClearSearch}
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Effacer la recherche
          </Button>
        )}
        
        {action && (
          <Button 
            onClick={action.onClick}
            variant="default"
            size="sm"
          >
            {action.icon || <Plus className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}

export default DataTableEmpty