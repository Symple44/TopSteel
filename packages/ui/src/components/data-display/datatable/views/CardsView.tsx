'use client'

import { MoreHorizontal } from 'lucide-react'
import { Button } from '../../../primitives/button'
import { DropdownItem, DropdownPortal } from '../../../primitives/dropdown-portal'
import { Badge } from '../..//badge'
import type { Card } from '../use-data-views'

interface CardsViewProps {
  cards: Card[]
  cardsPerRow?: number
  onCardClick?: (card: Card) => void
  onCardEdit?: (card: Card) => void
  onCardDelete?: (card: Card) => void
}

export function CardsView({
  cards,
  cardsPerRow = 3,
  onCardClick,
  onCardEdit,
  onCardDelete,
}: CardsViewProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
  }

  const gridClass =
    gridCols[Math.min(cardsPerRow, 6) as keyof typeof gridCols] ||
    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          className="bg-background border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow w-full text-left"
          onClick={() => onCardClick?.(card)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCardClick?.(card)}
          tabIndex={0}
          aria-label={`View details for ${card.title}`}
        >
          {/* Image de la carte */}
          {card.image && (
            <div className="aspect-video overflow-hidden">
              <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-4">
            {/* En-tête avec titre et actions */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base line-clamp-2 mb-1">{card.title}</h3>
                {card.subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{card.subtitle}</p>
                )}
              </div>

              <DropdownPortal
                align="end"
                trigger={
                  <Button
                    type="button"
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

            {/* Description */}
            {card.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{card.description}</p>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {card.labels.slice(0, 4).map((label, index) => (
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
                {card.labels.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{card.labels.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* Métadonnées */}
            {card.meta && card.meta.length > 0 && (
              <div className="space-y-2">
                {card.meta.slice(0, 4).map((meta, index) => (
                  <div key={`meta-${meta.label}-${index}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{meta.label}:</span>
                    <span className="text-right truncate ml-2">{meta.value}</span>
                  </div>
                ))}
                {card.meta.length > 4 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{card.meta.length - 4} autres champs
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer avec infos supplémentaires */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <span>ID: {card.id}</span>
              {/* Placeholder pour d'autres infos comme la date, assignee, etc. */}
            </div>
          </div>
        </button>
      ))}

      {/* Carte vide si aucune donnée */}
      {cards.length === 0 && (
        <div className="col-span-full flex items-center justify-center py-16 text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-lg font-medium mb-1">Aucune carte à afficher</p>
            <p className="text-sm">Ajustez vos filtres ou ajoutez des données</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardsView
