'use client'

import { Badge } from '@erp/ui'
import { Clock, Tag } from 'lucide-react'
import React from 'react'
import type { TranslationEntry } from '@/lib/i18n/types'

export const NamespaceCell = React.memo(({ value }: { value: string }) => (
  <Badge variant="secondary" className="text-xs">
    {value}
  </Badge>
))

export const CategoryCell = React.memo(({ value }: { value?: string }) =>
  value ? (
    <Badge variant="outline" className="text-xs">
      <Tag className="h-3 w-3 mr-1" />
      {value}
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground italic">Aucune</span>
  )
)

export const StatusCell = React.memo(({ value }: { value: boolean }) => (
  <div className="flex items-center gap-2">
    {value ? (
      <Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
        <Clock className="h-3 w-3 mr-1" />
        Modifiée
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        Original
      </Badge>
    )}
  </div>
))

export const FullKeyCell = React.memo(({ entry }: { entry: TranslationEntry }) => (
  <div className="space-y-1">
    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{entry.fullKey}</code>
    <div className="flex items-center gap-1 flex-wrap">
      <Badge variant="secondary" className="text-xs">
        {entry.namespace}
      </Badge>
      {entry.category && (
        <Badge variant="outline" className="text-xs">
          <Tag className="h-3 w-3 mr-1" />
          {entry.category}
        </Badge>
      )}
      {entry.isModified && (
        <Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Modifiée
        </Badge>
      )}
    </div>
  </div>
))

export const TranslationCell = React.memo(({ translation }: { translation: string }) => {
  const isEmpty = typeof translation !== 'string' || !translation.trim()

  if (isEmpty) {
    return (
      <div className="min-h-[40px] flex items-center">
        <p className="text-sm text-muted-foreground italic">(Non traduit)</p>
      </div>
    )
  }

  // Si la traduction contient du HTML, l'afficher comme rich text
  if (translation.includes('<') && translation.includes('>')) {
    return (
      <div
        className="min-h-[40px] richtext-cell text-sm"
        dangerouslySetInnerHTML={{ __html: translation }}
      />
    )
  }

  // Sinon affichage normal
  return (
    <div className="min-h-[40px] flex items-center">
      <p className="text-sm">{translation}</p>
    </div>
  )
})

export const DescriptionCell = React.memo(({ value }: { value?: string }) => (
  <span className="text-xs text-muted-foreground">{String(value || '(Aucune description)')}</span>
))

// Noms d'affichage pour React DevTools
NamespaceCell.displayName = 'NamespaceCell'
CategoryCell.displayName = 'CategoryCell'
StatusCell.displayName = 'StatusCell'
FullKeyCell.displayName = 'FullKeyCell'
TranslationCell.displayName = 'TranslationCell'
DescriptionCell.displayName = 'DescriptionCell'
