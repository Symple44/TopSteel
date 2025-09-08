'use client'

import { MoreHorizontal } from 'lucide-react'
import React from 'react'
import { Button } from '../../../../primitives/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../primitives/dropdown/DropdownMenu'

interface InlineActionsProps<T> {
  row: T
  actions: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    variant?: 'default' | 'destructive' | 'outline'
    disabled?: (row: T) => boolean
    separator?: boolean
  }>
}

/**
 * Actions en ligne pour chaque ligne du tableau
 */
export function InlineActions<T>({ row, actions }: InlineActionsProps<T>) {
  // Filtrer les actions visibles
  const visibleActions = actions.filter((action) => {
    if (action.disabled) {
      return !action.disabled(row)
    }
    return true
  })

  if (visibleActions.length === 0) {
    return null
  }

  // Si une seule action, afficher directement le bouton
  if (visibleActions.length === 1) {
    const action = visibleActions[0]
    return (
      <Button
        type="button"
        variant={action.variant || 'outline'}
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          action.onClick(row)
        }}
        disabled={action.disabled?.(row)}
      >
        {action.icon}
        {action.label}
      </Button>
    )
  }

  // Si plusieurs actions, afficher un menu dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {action.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                action.onClick(row)
              }}
              disabled={action.disabled?.(row)}
              className={
                action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''
              }
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
