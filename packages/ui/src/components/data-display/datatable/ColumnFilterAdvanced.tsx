'use client'

import { ArrowDown, ArrowUp, Calendar, Check, Filter, Hash, Search, X } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../../lib/utils'
import { Label } from '../../primitives'
import { Button } from '../../primitives/button'
import { Input } from '../../primitives/input'

// Pagination
const PAGE_SIZE = 50

type FilterType =
  | {
      type: 'values'
      values: string[]
    }
  | {
      type: 'range'
      min: number | null
      max: number | null
    }
  | {
      type: 'dateRange'
      start: string | null
      end: string | null
    }

interface ColumnConfig<T> {
  id: string
  title: string
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'richtext'
  key?: keyof T | string
  getValue?: (row: T) => unknown
}

interface ColumnFilterAdvancedProps<T = Record<string, unknown>> {
  column: ColumnConfig<T>
  data: T[]
  currentSort?: 'asc' | 'desc' | null
  currentFilters?: FilterType | null
  onSort: (direction: 'asc' | 'desc' | null) => void
  onFilter: (filter: FilterType | null) => void
}

export function ColumnFilterAdvanced<T = Record<string, unknown>>({
  column,
  data,
  currentSort,
  currentFilters = null,
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
  const [currentPage, setCurrentPage] = useState(0)

  // Initialiser/réinitialiser les valeurs sélectionnées à partir des filtres actuels
  useEffect(() => {
    if (!currentFilters) {
      // Réinitialiser tous les états quand le filtre est effacé
      setSelectedValues(new Set())
      setNumberRange({ min: '', max: '' })
      setDateRange({ start: '', end: '' })
      setShowOnlySelected(false)
      setCurrentPage(0)
    } else if (
      currentFilters.type === 'values' &&
      Array.isArray(currentFilters.values)
    ) {
      setSelectedValues(new Set(currentFilters.values))
    } else if (currentFilters.type === 'range') {
      setNumberRange({
        min: currentFilters.min !== null ? String(currentFilters.min) : '',
        max: currentFilters.max !== null ? String(currentFilters.max) : '',
      })
    } else if (currentFilters.type === 'dateRange') {
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
          return (item as Record<string, unknown>)[String(column.key || column.id)]
        }
      })
      .filter((v) => v != null)

    if (sample.length === 0) return 'text'

    const firstValue = sample[0]
    if (typeof firstValue === 'number') return 'number'
    if (typeof firstValue === 'boolean') return 'boolean'
    if (typeof firstValue === 'string' && !Number.isNaN(Date.parse(firstValue))) return 'date'
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
        value = (item as Record<string, unknown>)[String(column.key || column.id)]
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
      const value = (item as Record<string, unknown>)[column.id]
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

  // Callbacks pour appliquer/effacer les filtres (définis avant le useEffect qui les utilise)
  const handleApplyFilter = useCallback(() => {
    let filter: FilterType | null = null

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
    setShowOnlySelected(false)
    setIsOpen(false)
  }, [columnType, selectedValues, numberRange, dateRange, onFilter])

  const handleClearFilter = useCallback(() => {
    setSelectedValues(new Set())
    setNumberRange({ min: '', max: '' })
    setDateRange({ start: '', end: '' })
    setShowOnlySelected(false)
    onFilter(null)
    setIsOpen(false)
  }, [onFilter])

  // Raccourcis clavier : Échap pour fermer, Entrée pour appliquer
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      // Ne pas intercepter si on est dans un champ de saisie et qu'on tape du texte
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setIsOpen(false)
      } else if (event.key === 'Enter' && !isInputField) {
        // Appliquer le filtre seulement si on n'est pas dans un champ de saisie
        event.preventDefault()
        event.stopPropagation()
        handleApplyFilter()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleApplyFilter])

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

    // Repositionner au scroll/resize au lieu de fermer
    const handleScrollOrResize = (event?: Event) => {
      // Ne pas repositionner si le scroll vient du dropdown lui-même
      if (event?.target && dropdownRef.current) {
        const target = event.target as Element
        if (dropdownRef.current.contains(target)) {
          return
        }
      }
      // Repositionner au lieu de fermer
      requestAnimationFrame(positionDropdown)
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

  const filteredValues = useMemo(() => {
    return uniqueValues.filter((value) => {
      const matchesSearch = value.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSelection = showOnlySelected ? selectedValues.has(value) : true
      return matchesSearch && matchesSelection
    })
  }, [uniqueValues, searchTerm, showOnlySelected, selectedValues])

  // Réinitialiser la page quand la recherche change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, showOnlySelected])

  // Calculs de pagination
  const totalPages = Math.ceil(filteredValues.length / PAGE_SIZE)
  const startIndex = currentPage * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredValues.length)

  // Valeurs à afficher (avec pagination)
  const displayedValues = useMemo(() => {
    return filteredValues.slice(startIndex, endIndex)
  }, [filteredValues, startIndex, endIndex])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)))
  }, [totalPages])

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
      <Button
        type="button"
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`h-6 w-6 p-0 transition-all duration-200 relative ${
          isFiltered
            ? 'text-primary bg-primary/15 hover:bg-primary/25'
            : hasSort
              ? 'text-primary/70 bg-primary/10 hover:bg-primary/20'
              : 'text-muted-foreground opacity-0 group-hover:opacity-70 hover:opacity-100 hover:bg-accent'
        }`}
        title={
          isFiltered
            ? 'Filtre actif - Cliquez pour modifier'
            : hasSort
              ? 'Tri actif - Cliquez pour filtrer'
              : 'Filtrer cette colonne'
        }
      >
        <Filter className="h-3 w-3" />
        {/* Badge indicateur filtre actif */}
        {isFiltered && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        )}
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <>
            {/* Styles pour la scrollbar */}
            <style>{`
              .filter-values-scroll::-webkit-scrollbar {
                width: 6px;
              }
              .filter-values-scroll::-webkit-scrollbar-track {
                background: hsl(var(--muted) / 0.3);
                border-radius: 3px;
              }
              .filter-values-scroll::-webkit-scrollbar-thumb {
                background: hsl(var(--muted-foreground) / 0.3);
                border-radius: 3px;
              }
              .filter-values-scroll::-webkit-scrollbar-thumb:hover {
                background: hsl(var(--muted-foreground) / 0.5);
              }
            `}</style>
            <div
              ref={dropdownRef}
              className="column-filter-advanced w-72 bg-background border border-border rounded-md shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
              style={{
                position: 'fixed',
                zIndex: 50000,
              }}
            >
            {/* Header compact */}
            <div className="px-2.5 py-2 border-b border-border bg-muted/50">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-medium text-xs truncate">{column.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {uniqueValues.length} valeurs
                </span>
              </div>

              {/* Boutons de tri compacts */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort(currentSort === 'asc' ? null : 'asc')
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 h-6 text-[11px] rounded border transition-colors',
                    currentSort === 'asc'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  )}
                >
                  <ArrowUp className="h-3 w-3" />
                  A→Z
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort(currentSort === 'desc' ? null : 'desc')
                  }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 h-6 text-[11px] rounded border transition-colors',
                    currentSort === 'desc'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  )}
                >
                  <ArrowDown className="h-3 w-3" />
                  Z→A
                </button>
                {currentSort && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSort(null)
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded border border-border bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                    title="Supprimer le tri"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Contenu du filtre selon le type */}
            <div className="px-2.5 py-2">
              {(columnType === 'text' ||
                columnType === 'select' ||
                columnType === 'boolean' ||
                columnType === 'richtext') && (
                <>
                  {/* Barre de recherche compacte */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchTerm(e.target.value)
                      }
                      onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.stopPropagation()}
                      className="pl-7 h-7 text-xs"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Barre d'outils compacte */}
                  <div className="flex items-center justify-between gap-1 mb-2 pb-1.5 border-b border-border/30">
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowOnlySelected(false)
                        }}
                        className={cn(
                          'px-2 py-0.5 text-[10px] rounded transition-colors',
                          !showOnlySelected
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        Tous
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectedValues.size > 0) setShowOnlySelected(true)
                        }}
                        disabled={selectedValues.size === 0}
                        className={cn(
                          'px-2 py-0.5 text-[10px] rounded transition-colors',
                          showOnlySelected
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted disabled:opacity-50'
                        )}
                      >
                        Sélection ({selectedValues.size})
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleAll()
                      }}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {selectedValues.size === filteredValues.length ? 'Aucun' : 'Tout'}
                    </button>
                  </div>

                  {/* Liste des valeurs avec scroll stylisé */}
                  <div
                    className="border rounded bg-background overflow-hidden"
                    style={{ maxHeight: 'min(200px, 40vh)' }}
                  >
                    <div className="overflow-y-auto h-full filter-values-scroll">
                      {displayedValues.map((value) => (
                        <div
                          key={value}
                          role="checkbox"
                          aria-checked={selectedValues.has(value)}
                          tabIndex={0}
                          onClick={() => toggleValue(value)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault()
                              toggleValue(value)
                            }
                          }}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-border/20 last:border-0 transition-colors select-none',
                            selectedValues.has(value)
                              ? 'bg-primary/10 hover:bg-primary/15'
                              : 'hover:bg-muted/50'
                          )}
                        >
                          <span
                            className={cn(
                              'flex items-center justify-center h-4 w-4 rounded border-2 flex-shrink-0 transition-colors',
                              selectedValues.has(value)
                                ? 'bg-primary border-primary text-white'
                                : 'border-muted-foreground/40 bg-background'
                            )}
                          >
                            {selectedValues.has(value) && (
                              <Check className="h-3 w-3" strokeWidth={3} />
                            )}
                          </span>
                          <span
                            className={cn(
                              'text-xs truncate flex-1',
                              value === '(Vide)' && 'italic text-muted-foreground'
                            )}
                          >
                            {value}
                          </span>
                        </div>
                      ))}

                      {/* Message si aucun résultat */}
                      {filteredValues.length === 0 && (
                        <div className="py-3 text-center text-xs text-muted-foreground">
                          Aucun résultat
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pagination et compteur */}
                  <div className="mt-1.5 flex items-center justify-between">
                    {/* Pagination */}
                    {totalPages > 1 ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            goToPage(currentPage - 1)
                          }}
                          disabled={currentPage === 0}
                          className="h-5 w-5 flex items-center justify-center text-[10px] rounded border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ‹
                        </button>
                        <span className="text-[10px] text-muted-foreground px-1">
                          {currentPage + 1}/{totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            goToPage(currentPage + 1)
                          }}
                          disabled={currentPage >= totalPages - 1}
                          className="h-5 w-5 flex items-center justify-center text-[10px] rounded border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ›
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* Compteur */}
                    <div className="text-[10px] text-muted-foreground">
                      {startIndex + 1}-{endIndex}/{filteredValues.length}
                      {selectedValues.size > 0 && (
                        <span className="text-primary font-medium"> • {selectedValues.size} ✓</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {columnType === 'number' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span>Plage numérique</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Min</Label>
                      <Input
                        type="number"
                        placeholder={String(numberBounds.min)}
                        value={numberRange.min}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNumberRange((prev) => ({ ...prev, min: e.target.value }))
                        }
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.stopPropagation()}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Max</Label>
                      <Input
                        type="number"
                        placeholder={String(numberBounds.max)}
                        value={numberRange.max}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNumberRange((prev) => ({ ...prev, max: e.target.value }))
                        }
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.stopPropagation()}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {columnType === 'date' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Période</span>
                  </div>

                  {/* Filtres rapides compacts */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: "Auj.", days: 0 },
                      { label: '7j', days: 7 },
                      { label: '30j', days: 30 },
                      { label: '90j', days: 90 },
                    ].map(({ label, days }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const today = new Date()
                          const end = today.toISOString().split('T')[0]
                          const start = days === 0
                            ? end
                            : new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                          setDateRange({ start, end })
                        }}
                        className="px-2 py-0.5 text-[10px] rounded border border-border bg-background hover:bg-muted transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Du</Label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDateRange((prev) => ({ ...prev, start: e.target.value }))
                        }
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.stopPropagation()}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Au</Label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDateRange((prev) => ({ ...prev, end: e.target.value }))
                        }
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.stopPropagation()}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer compact */}
            <div className="px-2.5 py-2 border-t border-border bg-muted/30 flex gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearFilter()
                }}
                className="flex-1 h-7 flex items-center justify-center gap-1 text-xs rounded border border-border bg-background hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3" />
                Effacer
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleApplyFilter()
                }}
                className="flex-1 h-7 flex items-center justify-center gap-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Check className="h-3 w-3" />
                Appliquer
              </button>
            </div>
            </div>
          </>,
          document.body
        )}
    </>
  )
}

export default ColumnFilterAdvanced
