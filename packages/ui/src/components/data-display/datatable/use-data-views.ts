'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ColumnConfig } from './types'
import type { MapMarker } from './views/MapView'

export type ViewType = 'table' | 'kanban' | 'cards' | 'timeline' | 'calendar' | 'map'

export interface ViewConfig {
  type: ViewType
  name: string
  icon: string
  settings: ViewSettings
}

export interface ViewSettings {
  // Kanban specific
  kanban?: {
    statusColumn: string
    groupByColumn?: string
    cardTitleColumn: string
    cardSubtitleColumn?: string
    cardDescriptionColumn?: string
    cardImageColumn?: string
    cardLabelsColumns?: string[]
    metaColumns?: string[]
  }

  // Cards specific
  cards?: {
    titleColumn: string
    subtitleColumn?: string
    imageColumn?: string
    descriptionColumn?: string
    metaColumns?: string[]
    cardsPerRow?: number
  }

  // Timeline specific
  timeline?: {
    dateColumn: string
    titleColumn: string
    descriptionColumn?: string
    categoryColumn?: string
  }

  // Calendar specific
  calendar?: {
    startDateColumn: string
    endDateColumn?: string
    titleColumn: string
    categoryColumn?: string
  }

  // Map specific
  map?: {
    latColumn: string
    lngColumn: string
    titleColumn: string
    subtitleColumn?: string
    descriptionColumn?: string
    categoryColumn?: string
    metaColumns?: string[]
  }
}

export interface KanbanColumn {
  id: string
  title: string
  items: Card[]
  color?: string
}

export interface Card extends Record<string, unknown> {
  id: string
  title: string
  subtitle?: string
  description?: string
  image?: string
  labels?: { text: string; color?: string }[]
  meta?: { label: string; value: string }[]
  originalData: Record<string, unknown>
}

export interface TimelineItem extends Record<string, unknown> {
  id: string
  date: Date
  title: string
  description?: string
  category?: string
  color?: string
  originalData: Record<string, unknown>
}

export interface CalendarEvent extends Record<string, unknown> {
  id: string
  title: string
  start: Date
  end?: Date
  category?: string
  color?: string
  originalData: Record<string, unknown>
}

export function useDataViews<T = Record<string, unknown>>(
  data: T[],
  columns: ColumnConfig<T>[],
  keyField: string
) {
  const [currentView, setCurrentView] = useState<ViewType>('table')
  const [viewConfigs, setViewConfigs] = useState<Record<ViewType, ViewConfig>>({
    table: {
      type: 'table',
      name: 'Tableau',
      icon: 'Table',
      settings: {},
    },
    kanban: {
      type: 'kanban',
      name: 'Kanban',
      icon: 'Kanban',
      settings: {
        kanban: {
          statusColumn: columns[0]?.id || '',
          cardTitleColumn: columns[1]?.id || columns[0]?.id || '',
          cardSubtitleColumn: columns[2]?.id,
          cardDescriptionColumn: columns[3]?.id,
          cardImageColumn: undefined,
          cardLabelsColumns: [],
          metaColumns: [],
        },
      },
    },
    cards: {
      type: 'cards',
      name: 'Cartes',
      icon: 'Grid3x3',
      settings: {
        cards: {
          titleColumn: columns[0]?.id || '',
          subtitleColumn: columns[1]?.id,
          descriptionColumn: columns[2]?.id,
          imageColumn: undefined,
          metaColumns: [],
          cardsPerRow: 3,
        },
      },
    },
    timeline: {
      type: 'timeline',
      name: 'Timeline',
      icon: 'Clock',
      settings: {
        timeline: {
          dateColumn: columns.find((c) => c.type === 'date')?.id || columns[0]?.id || '',
          titleColumn: columns[1]?.id || columns[0]?.id || '',
        },
      },
    },
    calendar: {
      type: 'calendar',
      name: 'Calendrier',
      icon: 'Calendar',
      settings: {
        calendar: {
          startDateColumn: columns.find((c) => c.type === 'date')?.id || columns[0]?.id || '',
          titleColumn: columns[1]?.id || columns[0]?.id || '',
        },
      },
    },
    map: {
      type: 'map',
      name: 'Carte',
      icon: 'Map',
      settings: {
        map: {
          latColumn: columns.find((c) => c.id === 'lat' || c.key === 'lat' || c.id === 'latitude' || c.key === 'latitude')?.id || '',
          lngColumn: columns.find((c) => c.id === 'lng' || c.key === 'lng' || c.id === 'longitude' || c.key === 'longitude')?.id || '',
          titleColumn: columns[0]?.id || '',
          subtitleColumn: columns[1]?.id,
          categoryColumn: columns.find((c) => c.type === 'select')?.id,
          metaColumns: [],
        },
      },
    },
  })

  // Transformer une ligne en carte
  const transformToCard = useCallback(
    (
      item: T,
      config: ViewSettings['kanban'] | ViewSettings['cards'] | Record<string, unknown> | undefined,
      columns: ColumnConfig<T>[],
      index: number
    ): Card => {
      // Handle different config structures (kanban vs cards vs other views)
      const configObj = config as Record<string, unknown>
      const titleColumnId = (configObj?.cardTitleColumn || configObj?.titleColumn) as
        | string
        | undefined
      const subtitleColumnId = (configObj?.cardSubtitleColumn || configObj?.subtitleColumn) as
        | string
        | undefined
      const descriptionColumnId = (configObj?.cardDescriptionColumn ||
        configObj?.descriptionColumn) as string | undefined
      const imageColumnId = (configObj?.cardImageColumn || configObj?.imageColumn) as
        | string
        | undefined

      const titleColumn = columns.find((c) => c.id === titleColumnId)
      const subtitleColumn = subtitleColumnId
        ? columns.find((c) => c.id === subtitleColumnId)
        : null
      const descriptionColumn = descriptionColumnId
        ? columns.find((c) => c.id === descriptionColumnId)
        : null
      const imageColumn = imageColumnId ? columns.find((c) => c.id === imageColumnId) : null

      const title = titleColumn
        ? String(
            (titleColumn.getValue
              ? titleColumn.getValue(item)
              : (item as Record<string, unknown>)[titleColumn.key]) || 'Sans titre'
          )
        : 'Sans titre'

      const subtitle = subtitleColumn
        ? String(
            (subtitleColumn.getValue
              ? subtitleColumn.getValue(item)
              : (item as Record<string, unknown>)[subtitleColumn.key]) || ''
          )
        : undefined

      const description = descriptionColumn
        ? String(
            (descriptionColumn.getValue
              ? descriptionColumn.getValue(item)
              : (item as Record<string, unknown>)[descriptionColumn.key]) || ''
          )
        : undefined

      const image = imageColumn
        ? String(
            (imageColumn.getValue
              ? imageColumn.getValue(item)
              : (item as Record<string, unknown>)[imageColumn.key]) || ''
          )
        : undefined

      // Créer les labels à partir des colonnes configurées
      const labels: { text: string; color?: string }[] = []
      const labelsColumns =
        ((configObj?.cardLabelsColumns || configObj?.labelsColumns) as string[]) || []
      if (labelsColumns && Array.isArray(labelsColumns)) {
        labelsColumns.forEach((colId: string) => {
          if (colId) {
            const column = columns.find((c) => c.id === colId)
            if (column) {
              const value = column.getValue
                ? column.getValue(item)
                : (item as Record<string, unknown>)[column.key]

              // Pour les colonnes boolean, toujours afficher avec case cochée/décochée
              if (
                column.type === 'boolean' ||
                typeof value === 'boolean' ||
                value === true ||
                value === false ||
                value === 'true' ||
                value === 'false'
              ) {
                const checkmark = value === true || value === 'true' ? '☑' : '☐'
                labels.push({
                  text: `${column.title} ${checkmark}`,
                  color: getColorForLabel(column.title),
                })
              } else if (value !== null && value !== undefined && value !== '') {
                labels.push({
                  text: String(value),
                  color: getColorForLabel(String(value)),
                })
              }
            }
          }
        })
      }

      // Créer les méta-données
      const meta: { label: string; value: string }[] = []
      const metaColumns = (configObj?.metaColumns as string[]) || []
      if (metaColumns && Array.isArray(metaColumns)) {
        metaColumns.forEach((colId: string) => {
          if (colId) {
            const column = columns.find((c) => c.id === colId)
            if (column) {
              const value = column.getValue
                ? column.getValue(item)
                : (item as Record<string, unknown>)[column.key]

              // Pour les colonnes boolean, toujours afficher avec case cochée/décochée
              if (
                column.type === 'boolean' ||
                typeof value === 'boolean' ||
                value === true ||
                value === false ||
                value === 'true' ||
                value === 'false'
              ) {
                const checkmark = value === true || value === 'true' ? '☑' : '☐'
                meta.push({
                  label: column.title,
                  value: checkmark,
                })
              } else if (value !== null && value !== undefined && value !== '') {
                meta.push({
                  label: column.title,
                  value: String(value),
                })
              }
            }
          }
        })
      }

      return {
        id: String((item as Record<string, unknown>)[keyField] || `item-${index}`),
        title,
        subtitle,
        description,
        image,
        labels,
        meta,
        originalData: item as Record<string, unknown>,
      }
    },
    [keyField]
  )

  // Transformer les données pour le mode Kanban
  const kanbanData = useMemo(() => {
    const config = viewConfigs.kanban.settings.kanban
    if (!config) return []

    const statusColumn = columns.find((c) => c.id === config.statusColumn)
    if (!statusColumn) return []

    // Obtenir toutes les valeurs uniques de statut
    const statusValues = new Set<string>()
    data.forEach((item) => {
      const value = statusColumn.getValue
        ? statusColumn.getValue(item)
        : (item as Record<string, unknown>)[statusColumn.key]
      const normalizedValue = value === null || value === undefined ? 'Non défini' : String(value)
      statusValues.add(normalizedValue)
    })

    // Créer les colonnes Kanban
    const kanbanColumns: KanbanColumn[] = Array.from(statusValues).map((status) => ({
      id: status,
      title: status,
      items: [],
      color: getColorForStatus(status),
    }))

    // Répartir les éléments dans les colonnes
    data.forEach((item, index) => {
      const statusValue = statusColumn.getValue
        ? statusColumn.getValue(item)
        : (item as Record<string, unknown>)[statusColumn.key]
      const normalizedStatus =
        statusValue === null || statusValue === undefined ? 'Non défini' : String(statusValue)

      const column = kanbanColumns.find((col) => col.id === normalizedStatus)
      if (column) {
        column.items.push(transformToCard(item, config, columns, index))
      }
    })

    return kanbanColumns
  }, [data, columns, viewConfigs.kanban, transformToCard])

  // Transformer les données pour le mode Cards
  const cardsData = useMemo(() => {
    const config = viewConfigs.cards.settings.cards
    if (!config) return []

    return data.map((item, index) => transformToCard(item, config, columns, index))
  }, [data, columns, viewConfigs.cards, transformToCard])

  // Transformer les données pour le mode Timeline
  const timelineData = useMemo(() => {
    const config = viewConfigs.timeline.settings.timeline
    if (!config) return []

    const dateColumn = columns.find((c) => c.id === config.dateColumn)
    const titleColumn = columns.find((c) => c.id === config.titleColumn)

    if (!dateColumn || !titleColumn) return []

    return data
      .map((item, index) => {
        const dateValue = dateColumn.getValue
          ? dateColumn.getValue(item)
          : (item as Record<string, unknown>)[dateColumn.key]
        const titleValue = titleColumn.getValue
          ? titleColumn.getValue(item)
          : (item as Record<string, unknown>)[titleColumn.key]

        let date: Date
        if (dateValue instanceof Date) {
          date = dateValue
        } else if (typeof dateValue === 'string') {
          date = new Date(dateValue)
        } else {
          date = new Date()
        }

        return {
          id: (item as Record<string, unknown>)[keyField] || String(index),
          date,
          title: String(titleValue || 'Sans titre'),
          description: config.descriptionColumn
            ? String(
                (columns.find((c) => c.id === config.descriptionColumn)?.getValue
                  ? columns.find((c) => c.id === config.descriptionColumn)?.getValue?.(item)
                  : (item as Record<string, unknown>)[config.descriptionColumn!]) || ''
              )
            : undefined,
          category: config.categoryColumn
            ? String(
                (columns.find((c) => c.id === config.categoryColumn)?.getValue
                  ? columns.find((c) => c.id === config.categoryColumn)?.getValue?.(item)
                  : (item as Record<string, unknown>)[config.categoryColumn!]) || ''
              )
            : undefined,
          color: getColorForCategory(
            config.categoryColumn
              ? String(
                  (columns.find((c) => c.id === config.categoryColumn)?.getValue
                    ? columns.find((c) => c.id === config.categoryColumn)?.getValue?.(item)
                    : (item as Record<string, unknown>)[config.categoryColumn!]) || ''
                )
              : undefined
          ),
          originalData: item,
        } as TimelineItem
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [data, columns, viewConfigs.timeline, keyField])

  // Transformer les données pour le mode Calendar
  const calendarData = useMemo(() => {
    const config = viewConfigs.calendar.settings.calendar
    if (!config) return []

    const startDateColumn = columns.find((c) => c.id === config.startDateColumn)
    const titleColumn = columns.find((c) => c.id === config.titleColumn)

    if (!startDateColumn || !titleColumn) return []

    return data
      .map((item, index) => {
        const startDateValue = startDateColumn.getValue
          ? startDateColumn.getValue(item)
          : (item as Record<string, unknown>)[startDateColumn.key]
        const titleValue = titleColumn.getValue
          ? titleColumn.getValue(item)
          : (item as Record<string, unknown>)[titleColumn.key]

        let startDate: Date
        if (startDateValue instanceof Date) {
          startDate = startDateValue
        } else if (typeof startDateValue === 'string') {
          startDate = new Date(startDateValue)
        } else {
          startDate = new Date()
        }

        let endDate: Date | undefined
        if (config.endDateColumn) {
          const endDateColumn = columns.find((c) => c.id === config.endDateColumn)
          if (endDateColumn) {
            const endDateValue = endDateColumn.getValue
              ? endDateColumn.getValue(item)
              : (item as Record<string, unknown>)[endDateColumn.key]
            if (endDateValue instanceof Date) {
              endDate = endDateValue
            } else if (typeof endDateValue === 'string') {
              endDate = new Date(endDateValue)
            }
          }
        }

        return {
          id: (item as Record<string, unknown>)[keyField] || String(index),
          title: String(titleValue || 'Sans titre'),
          start: startDate,
          end: endDate,
          category: config.categoryColumn
            ? String(
                (columns.find((c) => c.id === config.categoryColumn)?.getValue
                  ? columns.find((c) => c.id === config.categoryColumn)?.getValue?.(item)
                  : (item as Record<string, unknown>)[config.categoryColumn!]) || ''
              )
            : undefined,
          color: getColorForCategory(
            config.categoryColumn
              ? String(
                  (columns.find((c) => c.id === config.categoryColumn)?.getValue
                    ? columns.find((c) => c.id === config.categoryColumn)?.getValue?.(item)
                    : (item as Record<string, unknown>)[config.categoryColumn!]) || ''
                )
              : undefined
          ),
          originalData: item,
        } as CalendarEvent
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [data, columns, viewConfigs.calendar, keyField])

  // Transformer les données pour le mode Map
  const mapData = useMemo((): MapMarker[] => {
    const config = viewConfigs.map.settings.map
    if (!config || !config.latColumn || !config.lngColumn) return []

    const latColumn = columns.find((c) => c.id === config.latColumn)
    const lngColumn = columns.find((c) => c.id === config.lngColumn)
    const titleColumn = columns.find((c) => c.id === config.titleColumn)

    if (!latColumn || !lngColumn) return []

    return data
      .map((item, index) => {
        const latValue = latColumn.getValue
          ? latColumn.getValue(item)
          : (item as Record<string, unknown>)[latColumn.key]
        const lngValue = lngColumn.getValue
          ? lngColumn.getValue(item)
          : (item as Record<string, unknown>)[lngColumn.key]

        const lat = typeof latValue === 'number' ? latValue : parseFloat(String(latValue))
        const lng = typeof lngValue === 'number' ? lngValue : parseFloat(String(lngValue))

        // Skip items without valid coordinates
        if (isNaN(lat) || isNaN(lng)) return null

        const titleValue = titleColumn
          ? (titleColumn.getValue
              ? titleColumn.getValue(item)
              : (item as Record<string, unknown>)[titleColumn.key])
          : 'Sans titre'

        const subtitleColumn = config.subtitleColumn
          ? columns.find((c) => c.id === config.subtitleColumn)
          : null
        const subtitleValue = subtitleColumn
          ? (subtitleColumn.getValue
              ? subtitleColumn.getValue(item)
              : (item as Record<string, unknown>)[subtitleColumn.key])
          : undefined

        const descriptionColumn = config.descriptionColumn
          ? columns.find((c) => c.id === config.descriptionColumn)
          : null
        const descriptionValue = descriptionColumn
          ? (descriptionColumn.getValue
              ? descriptionColumn.getValue(item)
              : (item as Record<string, unknown>)[descriptionColumn.key])
          : undefined

        const categoryColumn = config.categoryColumn
          ? columns.find((c) => c.id === config.categoryColumn)
          : null
        const categoryValue = categoryColumn
          ? (categoryColumn.getValue
              ? categoryColumn.getValue(item)
              : (item as Record<string, unknown>)[categoryColumn.key])
          : undefined

        // Créer les méta-données
        const meta: { label: string; value: string }[] = []
        const metaColumns = config.metaColumns || []
        metaColumns.forEach((colId: string) => {
          if (colId) {
            const column = columns.find((c) => c.id === colId)
            if (column) {
              const value = column.getValue
                ? column.getValue(item)
                : (item as Record<string, unknown>)[column.key]
              if (value !== null && value !== undefined && value !== '') {
                meta.push({
                  label: column.title,
                  value: String(value),
                })
              }
            }
          }
        })

        return {
          id: String((item as Record<string, unknown>)[keyField] || `marker-${index}`),
          lat,
          lng,
          title: String(titleValue || 'Sans titre'),
          subtitle: subtitleValue ? String(subtitleValue) : undefined,
          description: descriptionValue ? String(descriptionValue) : undefined,
          category: categoryValue ? String(categoryValue) : undefined,
          color: getColorForCategory(categoryValue ? String(categoryValue) : undefined),
          meta,
        } as MapMarker
      })
      .filter((marker): marker is MapMarker => marker !== null)
  }, [data, columns, viewConfigs.map, keyField])

  // Fonctions utilitaires
  const updateViewConfig = useCallback((viewType: ViewType, settings: ViewSettings) => {
    setViewConfigs((prev) => ({
      ...prev,
      [viewType]: {
        ...prev[viewType],
        settings,
      },
    }))
  }, [])

  const getAvailableViews = useCallback(() => {
    return Object.values(viewConfigs)
  }, [viewConfigs])

  const getCurrentViewConfig = useCallback(() => {
    return viewConfigs[currentView]
  }, [viewConfigs, currentView])

  return {
    currentView,
    setCurrentView,
    viewConfigs,
    updateViewConfig,
    getAvailableViews,
    getCurrentViewConfig,

    // Données transformées pour chaque vue
    kanbanData,
    cardsData,
    timelineData,
    calendarData,
    mapData,

    // Fonctions utilitaires
    transformToCard,
  }
}

// Fonctions utilitaires pour les couleurs
function getColorForStatus(status: string): string {
  const colorMap: Record<string, string> = {
    'À faire': '#ef4444',
    'En cours': '#f59e0b',
    Terminé: '#10b981',
    'En attente': '#6b7280',
    Annulé: '#dc2626',
  }
  return colorMap[status] || '#6b7280'
}

function getColorForCategory(category?: string): string {
  if (!category) return '#6b7280'

  const colorMap: Record<string, string> = {
    Urgent: '#ef4444',
    Important: '#f59e0b',
    Normal: '#10b981',
    Faible: '#6b7280',
  }
  return colorMap[category] || '#6b7280'
}

function getColorForLabel(label: string): string {
  // Générer une couleur basée sur le hash du label
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }

  const colors = [
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ]

  return colors[Math.abs(hash) % colors.length]
}
