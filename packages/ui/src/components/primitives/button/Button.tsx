/**
 * 🎯 BUTTON UNIFIÉ - TOPSTEEL ERP
 * Composant Button robuste avec variants étendus et support asChild
 * Basé sur Radix UI Slot pour une flexibilité maximale
 */

import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { buttonVariants } from '../../../design-system/variants'
import type { ButtonVariants } from '../../../design-system/variants'

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, 
    ButtonVariants {
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    const isDisabled = disabled || loading
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size }), className)} 
        ref={ref} 
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {leftIcon && !loading && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
