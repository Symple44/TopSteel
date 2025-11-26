import type * as React from 'react'

/**
 * Configuration pour les éléments interactifs
 */
export interface InteractiveConfig {
  onClick?: React.MouseEventHandler<HTMLElement>
  baseClassName: string
  className?: string
}

/**
 * Classes CSS pour les éléments interactifs
 */
export const INTERACTIVE_CLASSES =
  'cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

/**
 * Génère les classes CSS finales pour un élément potentiellement interactif
 */
export function getInteractiveClassName(config: InteractiveConfig): string {
  const { onClick, baseClassName, className } = config
  const isInteractive = Boolean(onClick)
  const interactiveClasses = isInteractive ? INTERACTIVE_CLASSES : ''
  return [baseClassName, interactiveClasses, className].filter(Boolean).join(' ')
}

/**
 * Props communes pour les éléments interactifs
 * Note: Ces props sont déjà incluses dans React.HTMLAttributes,
 * cette interface est utilisée uniquement pour la documentation
 */
export interface InteractiveElementProps {
  id?: string
  role?: string
}

/**
 * Crée un handler pour les événements clavier (Enter/Space)
 * qui simule un clic pour l'accessibilité
 */
export function createKeyboardClickHandler<T extends HTMLElement>(
  onClick?: React.MouseEventHandler<T>
): React.KeyboardEventHandler<T> | undefined {
  if (!onClick) return undefined

  return (e: React.KeyboardEvent<T>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Créer un événement synthétique de type MouseEvent
      const syntheticEvent = e as unknown as React.MouseEvent<T>
      onClick(syntheticEvent)
    }
  }
}

/**
 * Génère les props d'accessibilité pour un élément interactif
 */
export function getInteractiveA11yProps<T extends HTMLElement>(
  onClick?: React.MouseEventHandler<T>,
  role?: string
): {
  role?: string
  tabIndex?: number
  onKeyDown?: React.KeyboardEventHandler<T>
} {
  const isInteractive = Boolean(onClick)

  if (!isInteractive) {
    return {}
  }

  return {
    role: role || 'button',
    tabIndex: 0,
    onKeyDown: createKeyboardClickHandler(onClick),
  }
}

/**
 * Hook-like utility pour combiner toutes les props interactives
 */
export function useInteractiveProps<T extends HTMLElement>(
  config: InteractiveConfig & { role?: string }
): {
  className: string
  role?: string
  tabIndex?: number
  onKeyDown?: React.KeyboardEventHandler<T>
} {
  const className = getInteractiveClassName(config)
  const a11yProps = getInteractiveA11yProps<T>(config.onClick, config.role)

  return {
    className,
    ...a11yProps,
  }
}
