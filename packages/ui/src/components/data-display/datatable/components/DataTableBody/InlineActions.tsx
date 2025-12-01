'use client'

import { MoreHorizontal } from 'lucide-react'
import React from 'react'
import { cn } from '../../../../../lib/utils'
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
        variant="ghost"
        size="sm"
        className={cn(
          'h-7 px-2.5 text-xs font-medium',
          action.variant === 'destructive' && 'text-destructive hover:text-destructive hover:bg-destructive/10'
        )}
        onClick={(e) => {
          e.stopPropagation()
          action.onClick(row)
        }}
        disabled={action.disabled?.(row)}
      >
        {action.icon && <span className="mr-1.5">{action.icon}</span>}
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
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          onClick={(e) => e.stopPropagation()}
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {action.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                action.onClick(row)
              }}
              disabled={action.disabled?.(row)}
              className={cn(
                'cursor-pointer text-sm gap-2',
                action.variant === 'destructive' && 'text-destructive focus:text-destructive focus:bg-destructive/10'
              )}
            >
              {action.icon}
              <span>{action.label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
