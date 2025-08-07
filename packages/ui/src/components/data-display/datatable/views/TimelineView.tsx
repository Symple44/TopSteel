'use client'

import { Calendar, MoreHorizontal } from 'lucide-react'
import { Button } from '../../../primitives/button'
import { DropdownItem, DropdownPortal } from '../../../primitives/dropdown-portal'
import { Badge } from '../../badge'
import type { TimelineItem } from '../use-data-views'

interface TimelineViewProps {
  items: TimelineItem[]
  onItemClick?: (item: TimelineItem) => void
  onItemEdit?: (item: TimelineItem) => void
  onItemDelete?: (item: TimelineItem) => void
}

export function TimelineView({ items, onItemClick, onItemEdit, onItemDelete }: TimelineViewProps) {
  // Grouper les éléments par année/mois
  const groupedItems = items.reduce(
    (groups, item) => {
      const year = item.date.getFullYear()
      const month = item.date.getMonth()
      const key = `${year}-${month.toString().padStart(2, '0')}`

      if (!groups[key]) {
        groups[key] = {
          year,
          month,
          monthName: item.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          items: [],
        }
      }

      groups[key].items.push(item)
      return groups
    },
    {} as Record<string, { year: number; month: number; monthName: string; items: TimelineItem[] }>
  )

  const sortedGroups = Object.values(groupedItems).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Aucun élément dans la timeline</p>
          <p className="text-sm">Ajustez vos filtres ou ajoutez des données</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sortedGroups.map((group) => (
        <div key={`${group.year}-${group.month}`} className="relative">
          {/* Séparateur de mois */}
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold text-muted-foreground capitalize">
              {group.monthName}
            </h2>
            <div className="flex-1 h-px bg-border" />
            <Badge variant="outline" className="text-xs">
              {group.items.length} {group.items.length === 1 ? 'élément' : 'éléments'}
            </Badge>
          </div>

          {/* Timeline verticale */}
          <div className="relative">
            {/* Ligne de timeline */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {group.items
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((item, _index) => (
                  <button
                    key={item.id}
                    className="relative flex items-start gap-4 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -ml-2 w-full text-left"
                    onClick={() => onItemClick?.(item)}
                    type="button"
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onItemClick?.(item)}
                    tabIndex={0}
                    aria-label={`View details for ${item.title}`}
                  >
                    {/* Point de timeline */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className="w-3 h-3 rounded-full border-2 border-background"
                        style={{ backgroundColor: item.color || '#6b7280' }}
                      />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {item.date.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {item.category && (
                              <Badge
                                variant="outline"
                                className="text-xs"
                                style={{
                                  borderColor: item.color,
                                  color: item.color,
                                  backgroundColor: `${item.color}10`,
                                }}
                              >
                                {item.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <DropdownPortal
                          align="end"
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        >
                          {onItemEdit && (
                            <DropdownItem onClick={() => onItemEdit(item)}>Modifier</DropdownItem>
                          )}
                          {onItemDelete && (
                            <DropdownItem
                              onClick={() => onItemDelete(item)}
                              className="text-red-600"
                            >
                              Supprimer
                            </DropdownItem>
                          )}
                        </DropdownPortal>
                      </div>

                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TimelineView
