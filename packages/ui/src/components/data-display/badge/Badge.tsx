'use client'

import * as React from 'react'
import { type BadgeVariants, badgeVariants } from '../../../lib/design-system'
import { cn } from '../../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, BadgeVariants {
  /**
   * Label accessible pour les lecteurs d'écran
   * Décrit le contenu du badge
   */
  'aria-label'?: string
  /**
   * Le badge est-il décoratif uniquement
   * Si true, sera marqué aria-hidden
   */
  decorative?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    { className, variant, children, decorative = false, 'aria-label': ariaLabel, ...props },
    ref
  ) => {
    // Si c'est décoratif, on cache des lecteurs d'écran
    // Sinon, on s'assure qu'il y a un label accessible
    const accessibilityProps = decorative
      ? { 'aria-hidden': true }
      : {
          'aria-label': ariaLabel,
          // Ajout du rôle status pour les badges informatifs
          role: variant === 'default' || !variant ? 'status' : undefined,
        }

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...accessibilityProps}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
