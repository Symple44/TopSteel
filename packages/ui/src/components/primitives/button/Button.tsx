'use client'

/**
 * 🎯 BUTTON UNIFIÉ - TOPSTEEL ERP
 * Composant Button robuste avec variants étendus et support asChild
 * Basé sur Radix UI Slot pour une flexibilité maximale
 */

import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import type { ButtonVariants } from '../../../lib/design-system'
import { buttonVariants } from '../../../lib/design-system'
import { cn } from '../../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  /**
   * Utilise le composant enfant comme élément de base
   * Permet d'utiliser Button avec des liens, etc.
   * @default false
   */
  asChild?: boolean
  /**
   * État de chargement
   * Affiche un spinner et désactive le bouton
   * @default false
   */
  loading?: boolean
  /**
   * Icône à afficher à gauche du texte
   */
  leftIcon?: React.ReactNode
  /**
   * Icône à afficher à droite du texte
   */
  rightIcon?: React.ReactNode
  /**
   * Label accessible pour les lecteurs d'écran
   * Remplace ou complète le texte visible
   */
  'aria-label'?: string
  /**
   * Description accessible pour les lecteurs d'écran
   * Fournit des informations additionnelles
   */
  'aria-describedby'?: string
  /**
   * État pressé pour les boutons toggle
   */
  'aria-pressed'?: boolean | 'mixed'
  /**
   * État étendu/réduit pour les boutons d'accordéon
   */
  'aria-expanded'?: boolean
  /**
   * Contrôle un autre élément
   */
  'aria-controls'?: string
  /**
   * Indique si l'élément a une popup
   */
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedby,
      'aria-pressed': ariaPressed,
      'aria-expanded': ariaExpanded,
      'aria-controls': ariaControls,
      'aria-haspopup': ariaHaspopup,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    const isDisabled = disabled || loading

    // Construction des attributs ARIA
    const ariaProps = {
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedby,
      'aria-pressed': ariaPressed,
      'aria-expanded': ariaExpanded,
      'aria-controls': ariaControls,
      'aria-haspopup': ariaHaspopup,
      // Ajout automatique d'aria-busy pendant le chargement
      'aria-busy': loading ? true : undefined,
    }

    // Filtrer les props undefined pour éviter les attributs vides
    const filteredAriaProps = Object.fromEntries(
      Object.entries(ariaProps).filter(([_, value]) => value !== undefined)
    )

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isDisabled}
        {...filteredAriaProps}
        {...props}
      >
        {loading && (
          <>
            <div
              className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span className="sr-only">Chargement en cours</span>
          </>
        )}
        {leftIcon && !loading && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonVariants }
