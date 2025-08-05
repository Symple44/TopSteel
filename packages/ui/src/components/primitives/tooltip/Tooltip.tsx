/**
 * 🎯 TOOLTIP UNIFIÉ - TOPSTEEL ERP
 * Fusion des 4 implémentations existantes en une version robuste
 * Basé sur Radix UI avec positioning avancé et variants du design system
 */

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { tooltipVariants } from '../../../design-system/variants'
import type { TooltipVariants } from '../../../design-system/variants'

// ===== TYPES UNIFIÉS =====

export interface TooltipProviderProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider> {
  /**
   * Délai global par défaut avant affichage (ms)
   * @default 700
   */
  delayDuration?: number
  /**
   * Délai avant fermeture quand la souris sort (ms)
   * @default 300
   */
  skipDelayDuration?: number
  /**
   * Désactiver les tooltips globalement
   * @default false
   */
  disableHoverableContent?: boolean
}

export interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  /**
   * Contenu du tooltip
   */
  content?: React.ReactNode
  /**
   * État ouvert/fermé contrôlé
   */
  open?: boolean
  /**
   * Callback changement d'état
   */
  onOpenChange?: (open: boolean) => void
  /**
   * Délai avant affichage (ms)
   */
  delayDuration?: number
  /**
   * Désactiver ce tooltip
   */
  disabled?: boolean
}

export interface TooltipTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> {
  asChild?: boolean
}

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    TooltipVariants {
  /**
   * Offset depuis le trigger (px)
   * @default 4
   */
  sideOffset?: number
  /**
   * Offset d'alignement (px)
   * @default 0
   */
  alignOffset?: number
  /**
   * Éviter les collisions avec les bords
   * @default true
   */
  avoidCollisions?: boolean
  /**
   * Padding de collision (px)
   * @default 8
   */
  collisionPadding?: number
  /**
   * Forcer l'affichage même si pas d'espace
   * @default false
   */
  sticky?: 'partial' | 'always'
  /**
   * Afficher une flèche pointant vers le trigger
   * @default false
   */
  arrow?: boolean
  /**
   * Style de la flèche si activée
   */
  arrowClassName?: string
}

// ===== PROVIDER GLOBAL =====

/**
 * Provider global pour la configuration des tooltips
 * À placer à la racine de l'application
 */
const TooltipProvider: React.FC<TooltipProviderProps> = ({
  delayDuration = 700,
  skipDelayDuration = 300,
  disableHoverableContent = false,
  children,
  ...props
}) => (
  <TooltipPrimitive.Provider
    delayDuration={delayDuration}
    skipDelayDuration={skipDelayDuration}
    disableHoverableContent={disableHoverableContent}
    {...props}
  >
    {children}
  </TooltipPrimitive.Provider>
)
TooltipProvider.displayName = 'TooltipProvider'

// ===== COMPOSANTS PRINCIPAUX =====

/**
 * Racine du Tooltip - Support state controlled/uncontrolled
 */
const TooltipRoot: React.FC<TooltipProps> = ({
  delayDuration,
  open,
  onOpenChange,
  disabled = false,
  children,
  ...props
}) => {
  if (disabled) {
    // Si désactivé, retourner juste les enfants sans tooltip
    return <>{children}</>
  }

  return (
    <TooltipPrimitive.Root
      delayDuration={delayDuration}
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    >
      {children}
    </TooltipPrimitive.Root>
  )
}
TooltipRoot.displayName = 'TooltipRoot'

/**
 * Trigger du Tooltip
 */
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  TooltipTriggerProps
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    className={cn(
      // Styles par défaut pour le trigger
      'inline-flex items-center justify-center',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      className
    )}
    {...props}
  />
))
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName

/**
 * Contenu du Tooltip avec variants et positioning avancé
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      side = 'top',
      sideOffset = 4,
      alignOffset = 0,
      avoidCollisions = true,
      collisionPadding = 8,
      sticky = 'partial',
      arrow = false,
      arrowClassName,
      children,
      ...props
    },
    ref
  ) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        sticky={sticky}
        className={cn(
          tooltipVariants({ variant, size }),
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      >
        {children}
        {arrow && (
          <TooltipPrimitive.Arrow className={cn('fill-popover stroke-border', arrowClassName)} />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// ===== COMPOSANT COMPOSITE SIMPLE =====

/**
 * Tooltip simple pour usage rapide
 * Combine Root + Trigger + Content en un seul composant
 */
export interface SimpleTooltipProps {
  // Props du tooltip root
  content?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  delayDuration?: number
  disabled?: boolean

  // Props du trigger - accepte soit trigger soit children
  trigger?: React.ReactNode
  children?: React.ReactNode
  triggerClassName?: string
  triggerAsChild?: boolean

  // Props du content
  variant?: TooltipVariants['variant']
  size?: TooltipVariants['size']
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?: number
  sticky?: 'partial' | 'always'
  arrow?: boolean
  arrowClassName?: string
  className?: string
}

const SimpleTooltip = React.forwardRef<HTMLDivElement, SimpleTooltipProps>(
  (
    {
      // Props du tooltip root
      content,
      open,
      onOpenChange,
      delayDuration,
      disabled,

      // Props du trigger
      trigger,
      children,
      triggerClassName,
      triggerAsChild = false,

      // Props du content
      variant,
      size,
      side,
      sideOffset,
      alignOffset,
      avoidCollisions,
      collisionPadding,
      sticky,
      arrow,
      arrowClassName,
      className,

      ...props
    },
    ref
  ) => {
    // Utiliser children si fourni, sinon trigger
    const triggerContent = children || trigger

    if (!content || disabled) {
      // Si pas de contenu ou désactivé, retourner juste le trigger
      return (
        <div ref={ref} className={triggerClassName}>
          {triggerContent}
        </div>
      )
    }

    return (
      <TooltipRoot
        open={open}
        onOpenChange={onOpenChange}
        delayDuration={delayDuration}
        disabled={disabled}
      >
        <TooltipTrigger asChild={triggerAsChild} className={triggerClassName}>
          {triggerAsChild ? triggerContent : <div>{triggerContent}</div>}
        </TooltipTrigger>
        <TooltipContent
          ref={ref}
          variant={variant}
          size={size}
          side={side}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          avoidCollisions={avoidCollisions}
          collisionPadding={collisionPadding}
          sticky={sticky}
          arrow={arrow}
          arrowClassName={arrowClassName}
          className={className}
          {...props}
        >
          {content}
        </TooltipContent>
      </TooltipRoot>
    )
  }
)
SimpleTooltip.displayName = 'SimpleTooltip'

// ===== ALIAS POUR COMPATIBILITÉ =====

/**
 * Alias principal - identique à TooltipRoot
 */
const Tooltip = TooltipRoot

// ===== EXPORTS =====

export { TooltipProvider, Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, SimpleTooltip }

// Types déjà exportés avec les interfaces ci-dessus
