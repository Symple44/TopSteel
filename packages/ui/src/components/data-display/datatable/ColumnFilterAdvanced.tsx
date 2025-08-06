'use client'

import { ArrowDown, ArrowUp, Calendar, Check, Filter, Hash, Search, X } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Label } from '../../primitives'
import { Button } from '../../primitives/button'
import { Checkbox } from '../../primitives/checkbox'
import { Input } from '../../primitives/input'

interface ColumnFilterAdvancedProps<T = any> {
  column: {
    id: string
    title: string
    type?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'richtext'
    key?: keyof T | string
    getValue?: (row: T) => any
  }
  data: T[]
  currentSort?: 'asc' | 'desc' | null
  currentFilters?: any
  onSort: (direction: 'asc' | 'desc' | null) => void
  onFilter: (filter: any) => void
}

export function ColumnFilterAdvanced<T = any>({
  column,
  data,
  currentSort,
  currentFilters = {},
  onSort,
  onFilter,
}: ColumnFilterAdvancedProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // États pour les différents types de filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())
  const [numberRange, setNumberRange] = useState({ min: '', max: '' })
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showOnlySelected, setShowOnlySelected] = useState(false)

  // Initialiser les valeurs sélectionnées à partir des filtres actuels
  useEffect(() => {
    if (
      currentFilters &&
      currentFilters.type === 'values' &&
      Array.isArray(currentFilters.values)
    ) {
      setSelectedValues(new Set(currentFilters.values))
    } else if (currentFilters && currentFilters.type === 'range') {
      setNumberRange({
        min: currentFilters.min !== null ? String(currentFilters.min) : '',
        max: currentFilters.max !== null ? String(currentFilters.max) : '',
      })
    } else if (currentFilters && currentFilters.type === 'dateRange') {
      setDateRange({
        start: currentFilters.start || '',
        end: currentFilters.end || '',
      })
    }
  }, [currentFilters])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Détecter le type de colonne si non spécifié
  const columnType = useMemo(() => {
    if (column.type) return column.type

    // Analyser les données pour déterminer le type
    const sample = data
      .slice(0, 10)
      .map((item) => {
        // Utiliser getValue si défini, sinon utiliser la clé de la colonne
        if (typeof column.getValue === 'function') {
          return column.getValue(item)
        } else {
          return (item as any)[column.key || column.id]
        }
      })
      .filter((v) => v != null)

    if (sample.length === 0) return 'text'

    const firstValue = sample[0]
    if (typeof firstValue === 'number') return 'number'
    if (typeof firstValue === 'boolean') return 'boolean'
    if (!Number.isNaN(Date.parse(firstValue))) return 'date'
    return 'text'
  }, [column, data])

  // Extraire les valeurs uniques pour les filtres texte et select
  const uniqueValues = useMemo(() => {
    if (
      columnType !== 'text' &&
      columnType !== 'select' &&
      columnType !== 'boolean' &&
      columnType !== 'richtext'
    )
      return []

    const values = new Set<string>()
    let hasEmptyValues = false

    data.forEach((item) => {
      // Utiliser getValue si défini, sinon utiliser la clé de la colonne
      let value: unknown
      if (typeof column.getValue === 'function') {
        value = column.getValue(item)
      } else {
        value = (item as any)[column.key || column.id]
      }

      // Gérer les valeurs null/undefined/vides
      if (value == null || (typeof value === 'string' && value.trim() === '')) {
        hasEmptyValues = true
      } else {
        // Pour les booléens, convertir en texte lisible
        if (columnType === 'boolean') {
          values.add(value ? 'Oui' : 'Non')
        } else {
          let stringValue = String(value)
          // Pour les richtext, nettoyer les balises HTML pour l'affichage dans le filtre
          if (columnType === 'richtext' && stringValue.includes('<')) {
            stringValue = stringValue.replace(/<[^>]*>/g, '').trim()
          }
          // Ajouter la valeur si elle n'est pas vide après nettoyage
          if (stringValue.trim()) {
            values.add(stringValue)
          } else {
            hasEmptyValues = true
          }
        }
      }
    })

    // Ajouter l'option pour les valeurs vides s'il y en a
    const result = Array.from(values).sort()
    if (hasEmptyValues) {
      result.unshift('(Vide)') // Ajouter au début de la liste
    }

    return result
  }, [data, column, columnType])

  // Calculer les min/max pour les filtres numériques
  const numberBounds = useMemo(() => {
    if (columnType !== 'number') return { min: 0, max: 100 }

    let min = Infinity
    let max = -Infinity

    data.forEach((item) => {
      const value = (item as any)[column.id]
      if (typeof value === 'number') {
        min = Math.min(min, value)
        max = Math.max(max, value)
      }
    })

    return {
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 100 : max,
    }
  }, [data, column.id, columnType])

  // Fermer au clic externe
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Positionner le dropdown
  useEffect(() => {
    if (!isOpen || !buttonRef.current || !dropdownRef.current) return

    const positionDropdown = () => {
      if (!buttonRef.current || !dropdownRef.current) return

      const button = buttonRef.current
      const dropdown = dropdownRef.current
      const rect = button.getBoundingClientRect()
      const dropdownHeight = dropdown.offsetHeight
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom
      const spaceRight = viewportWidth - rect.left

      // Positionner en dessous ou au-dessus selon l'espace disponible
      if (spaceBelow >= dropdownHeight + 10 || spaceBelow > rect.top) {
        dropdown.style.top = `${rect.bottom + 4}px`
        dropdown.style.bottom = 'auto'
      } else {
        dropdown.style.top = 'auto'
        dropdown.style.bottom = `${viewportHeight - rect.top + 4}px`
      }

      // Ajuster la position horizontale si nécessaire
      if (spaceRight < 320) {
        dropdown.style.left = 'auto'
        dropdown.style.right = `${viewportWidth - rect.right}px`
      } else {
        dropdown.style.left = `${rect.left}px`
        dropdown.style.right = 'auto'
      }
    }

    // Position initiale avec un léger délai pour le rendu
    requestAnimationFrame(() => {
      positionDropdown()
    })

    // Gérer le scroll et le resize
    const handleScrollOrResize = (event?: Event) => {
      // Ne pas fermer si le scroll vient du dropdown lui-même
      if (event?.target && dropdownRef.current) {
        const target = event.target as Element
        if (dropdownRef.current.contains(target)) {
          return
        }
      }
      setIsOpen(false)
    }

    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen])

  const handleSort = (direction: 'asc' | 'desc' | null) => {
    onSort(direction)
    setIsOpen(false)
  }

  const handleApplyFilter = () => {
    let filter = null

    if (
      (columnType === 'text' ||
        columnType === 'select' ||
        columnType === 'boolean' ||
        columnType === 'richtext') &&
      selectedValues.size > 0
    ) {
      filter = { type: 'values', values: Array.from(selectedValues) }
    } else if (columnType === 'number' && (numberRange.min || numberRange.max)) {
      filter = {
        type: 'range',
        min: numberRange.min ? Number(numberRange.min) : null,
        max: numberRange.max ? Number(numberRange.max) : null,
      }
    } else if (columnType === 'date' && (dateRange.start || dateRange.end)) {
      filter = {
        type: 'dateRange',
        start: dateRange.start || null,
        end: dateRange.end || null,
      }
    }

    onFilter(filter)
    setShowOnlySelected(false) // Réinitialiser l'affichage
    setIsOpen(false)
  }

  const handleClearFilter = () => {
    setSelectedValues(new Set())
    setNumberRange({ min: '', max: '' })
    setDateRange({ start: '', end: '' })
    setShowOnlySelected(false) // Réinitialiser l'affichage
    onFilter(null)
    setIsOpen(false)
  }

  const toggleValue = (value: string) => {
    const newSet = new Set(selectedValues)
    if (newSet.has(value)) {
      newSet.delete(value)
    } else {
      newSet.add(value)
    }
    setSelectedValues(newSet)
  }

  const toggleAll = () => {
    if (showOnlySelected) {
      // En mode "Sélectionnés", désélectionner tout
      setSelectedValues(new Set())
    } else {
      // En mode "Tous", basculer entre tout sélectionner ou tout désélectionner
      if (selectedValues.size === uniqueValues.length) {
        setSelectedValues(new Set())
      } else {
        setSelectedValues(new Set(uniqueValues))
      }
    }
  }

  const filteredValues = uniqueValues.filter((value) => {
    const matchesSearch = value.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSelection = showOnlySelected ? selectedValues.has(value) : true
    return matchesSearch && matchesSelection
  })

  // Détecter si un filtre est réellement appliqué (pas juste défini)
  const isFiltered = React.useMemo(() => {
    if (!currentFilters) return false

    if (currentFilters.type === 'values' && Array.isArray(currentFilters.values)) {
      return currentFilters.values.length > 0
    }

    if (currentFilters.type === 'range') {
      return currentFilters.min != null || currentFilters.max != null
    }

    if (currentFilters.type === 'dateRange') {
      return !!currentFilters.start || !!currentFilters.end
    }

    return false
  }, [currentFilters])
  const hasSort = currentSort !== null

  return (
    <>
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={(e: any) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className={`h-6 w-6 p-0 transition-all duration-200 hover:bg-accent ${
            isFiltered
              ? 'text-blue-600 opacity-100'
              : hasSort
                ? 'text-blue-500 opacity-100'
                : 'text-muted-foreground opacity-0 group-hover:opacity-70 hover:opacity-100'
          }`}
          title={
            isFiltered
              ? 'Filtre actif - Cliquez pour modifier'
              : hasSort
                ? 'Tri actif'
                : 'Filtrer cette colonne'
          }
        >
          <Filter
            className={`h-3 w-3 transition-transform duration-200 ${
              isFiltered ? 'scale-110' : 'scale-100'
            } ${!isFiltered && !hasSort ? 'filter-icon-hover' : ''}`}
          />
        </Button>

        {/* Indicateur subtil pour filtre actif */}
        {isFiltered && (
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
        )}
      </div>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={dropdownRef}
            className="column-filter-advanced w-80 bg-background border border-border rounded-md shadow-2xl"
            style={{
              position: 'fixed',
              zIndex: 50000,
            }}
          >
            {/* Header */}
            <div className="p-3 border-b border-border bg-muted/50">
              <div className="font-medium text-sm mb-2">{column.title}</div>

              {/* Boutons de tri */}
              <div className="flex gap-1">
                <Button
                  variant={currentSort === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    handleSort(currentSort === 'desc' ? null : 'desc')
                  }}
                  className="flex-1"
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Croissant
                </Button>
                <Button
                  variant={currentSort === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    handleSort(currentSort === 'asc' ? null : 'asc')
                  }}
                  className="flex-1"
                >
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Décroissant
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: any) => {
                    e.stopPropagation()
                    handleSort(null)
                  }}
                  className="px-2"
                  title="Supprimer le tri"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Contenu du filtre selon le type */}
            <div className="p-3 max-h-96 overflow-y-auto">
              {(columnType === 'text' ||
                columnType === 'select' ||
                columnType === 'boolean' ||
                columnType === 'richtext') && (
                <>
                  {/* Barre de recherche */}
                  <div className="relative mb-3" role="presentation">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e: any) => setSearchTerm(e.target.value)}
                      onFocus={(e: any) => e.stopPropagation()}
                      className="pl-7 h-8 text-sm"
                    />
                  </div>

                  {/* Options d'affichage */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-1">
                      <Button
                        variant={showOnlySelected ? 'ghost' : 'default'}
                        size="sm"
                        onClick={(e: any) => {
                          e.stopPropagation()
                          setShowOnlySelected(false)
                        }}
                        className="text-xs h-6 px-2"
                      >
                        Tous
                      </Button>
                      <Button
                        variant={showOnlySelected ? 'default' : 'ghost'}
                        size="sm"
                        onClick={(e: any) => {
                          e.stopPropagation()
                          setShowOnlySelected(true)
                        }}
                        className="text-xs h-6 px-2"
                        disabled={selectedValues.size === 0}
                      >
                        Sélectionnés ({selectedValues.size})
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {filteredValues.length} affichés
                    </span>
                  </div>

                  {/* Actions de sélection */}
                  <div className="flex justify-between items-center mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: any) => {
                        e.stopPropagation()
                        toggleAll()
                      }}
                      className="text-xs"
                    >
                      {showOnlySelected
                        ? 'Désélectionner tout'
                        : selectedValues.size === uniqueValues.length
                          ? 'Désélectionner tout'
                          : 'Sélectionner tout'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {selectedValues.size} sélectionnés
                    </span>
                  </div>

                  {/* Liste des valeurs */}
                  <div className="space-y-1 max-h-48 overflow-y-auto border rounded p-2">
                    {filteredValues.map((value) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 p-1 hover:bg-muted/50 rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedValues.has(value)}
                          onCheckedChange={() => toggleValue(value)}
                        />
                        <span
                          className={`text-sm truncate flex-1 ${value === '(Vide)' ? 'italic text-muted-foreground' : ''}`}
                        >
                          {value === '(Vide)' ? '(Vide - Non traduit)' : value}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {columnType === 'number' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>Filtre numérique</span>
                  </div>

                  <div className="space-y-2">
                    <div role="presentation">
                      <Label className="text-xs">Minimum</Label>
                      <Input
                        type="number"
                        placeholder={`Min: ${numberBounds.min}`}
                        value={numberRange.min}
                        onChange={(e: any) =>
                          setNumberRange((prev) => ({ ...prev, min: e.target.value }))
                        }
                        onFocus={(e: any) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>

                    <div role="presentation">
                      <Label className="text-xs">Maximum</Label>
                      <Input
                        type="number"
                        placeholder={`Max: ${numberBounds.max}`}
                        value={numberRange.max}
                        onChange={(e: any) =>
                          setNumberRange((prev) => ({ ...prev, max: e.target.value }))
                        }
                        onFocus={(e: any) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              )}

              {columnType === 'date' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Filtre par date</span>
                  </div>

                  <div className="space-y-2">
                    <div role="presentation">
                      <Label className="text-xs">Date de début</Label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e: any) =>
                          setDateRange((prev) => ({ ...prev, start: e.target.value }))
                        }
                        onFocus={(e: any) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>

                    <div role="presentation">
                      <Label className="text-xs">Date de fin</Label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e: any) =>
                          setDateRange((prev) => ({ ...prev, end: e.target.value }))
                        }
                        onFocus={(e: any) => e.stopPropagation()}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer avec actions */}
            <div className="p-3 border-t border-border bg-muted/30 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e: any) => {
                  e.stopPropagation()
                  handleClearFilter()
                }}
                className="flex-1"
              >
                <X className="h-3 w-3 mr-1" />
                Effacer
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={(e: any) => {
                  e.stopPropagation()
                  handleApplyFilter()
                }}
                className="flex-1"
              >
                <Check className="h-3 w-3 mr-1" />
                Appliquer
              </Button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default ColumnFilterAdvanced
