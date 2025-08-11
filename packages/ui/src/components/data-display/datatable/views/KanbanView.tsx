'use client'

import { MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '../../../primitives/button'
import { DropdownItem, DropdownPortal } from '../../../primitives/dropdown-portal'
import { Badge } from '../../badge'
import type { Card, KanbanColumn } from '../use-data-views'

interface KanbanViewProps {
  columns: KanbanColumn[]
  onCardClick?: (card: Card) => void
  onCardEdit?: (card: Card) => void
  onCardDelete?: (card: Card) => void
  onAddCard?: (columnId: string) => void
}

export function KanbanView({
  columns,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onAddCard,
}: KanbanViewProps) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80 bg-muted/20 rounded-lg p-4">
          {/* En-tête de colonne */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {column.items.length}
              </Badge>
            </div>

            {onAddCard && (
              <Button variant="ghost" size="sm" onClick={() => onAddCard(column.id)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Liste des cartes */}
          <div className="space-y-3">
            {column.items.map((card) => (
              <button
                key={card.id}
                type="button"
                className="bg-background border rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-accent transition-all duration-200 group w-full text-left"
                onClick={() => onCardClick?.(card)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCardClick?.(card)}
                tabIndex={0}
                aria-label={`View details for ${card.title}`}
              >
                {/* Image de la carte */}
                {card.image && (
                  <div className="mb-3">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}

                {/* En-tête de carte avec colonne */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {column.title}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-accent-foreground transition-colors">
                    {card.title}
                  </h4>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                      {card.subtitle}
                    </p>
                  )}
                </div>

                {/* Description */}
                {card.description && (
                  <div className="mb-3 p-2 bg-muted/30 rounded text-xs text-foreground/80 line-clamp-3">
                    {card.description}
                  </div>
                )}

                {/* Labels */}
                {card.labels && card.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {card.labels.map((label: { text: string; color?: string }, index: number) => (
                      <Badge
                        key={`label-${label.text}-${index}`}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: label.color,
                          color: label.color,
                          backgroundColor: `${label.color}10`,
                        }}
                      >
                        {label.text}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Métadonnées */}
                {card.meta && card.meta.length > 0 && (
                  <div className="space-y-1 mb-3 border-t pt-2">
                    {card.meta
                      .slice(0, 3)
                      .map((meta: { label: string; value: string }, index: number) => (
                        <div
                          key={`meta-${meta.label}-${index}`}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-muted-foreground font-medium">{meta.label}:</span>
                          <span className="font-semibold text-foreground">{meta.value}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {/* Placeholder pour les avatars/assignees */}
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
                    {onCardEdit && (
                      <DropdownItem onClick={() => onCardEdit(card)}>Modifier</DropdownItem>
                    )}
                    {onCardDelete && (
                      <DropdownItem onClick={() => onCardDelete(card)} className="text-red-600">
                        Supprimer
                      </DropdownItem>
                    )}
                  </DropdownPortal>
                </div>
              </button>
            ))}

            {/* Zone de drop pour ajouter une carte */}
            {column.items.length === 0 && (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
                <p className="text-sm">Aucune carte dans cette colonne</p>
                {onAddCard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddCard(column.id)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une carte
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Colonne pour ajouter une nouvelle colonne */}
      <div className="flex-shrink-0 w-80">
        <div className="bg-muted/10 border-2 border-dashed border-muted rounded-lg p-4 h-full flex items-center justify-center">
          <Button variant="ghost" className="text-muted-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une colonne
          </Button>
        </div>
      </div>
    </div>
  )
}

export default KanbanView
