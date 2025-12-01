'use client'

// packages/ui/src/components/primitives/input/utils.ts
// Utilitaires partagés pour les composants Input

import type { ChangeEvent } from 'react'

/**
 * Convertit une valeur number en string pour l'affichage
 */
export function formatDisplayValue(
  value: string | number | undefined | null,
  type?: string,
  precision?: number
): string {
  if (value === undefined || value === null) return ''

  if (typeof value === 'number') {
    if (type === 'number' && precision !== undefined) {
      return value.toFixed(precision)
    }
    return value.toString()
  }

  return String(value)
}

/**
 * Détermine l'état visuel basé sur les props de validation
 */
export function getVisualState(
  error?: boolean | string,
  success?: boolean,
  warning?: boolean,
  state?: 'default' | 'error' | 'success' | 'warning' | null
): 'default' | 'error' | 'success' | 'warning' | null | undefined {
  if (error) return 'error'
  if (success) return 'success'
  if (warning) return 'warning'
  return state
}

/**
 * Détermine la variante automatiquement basée sur le type
 */
export function getAutoVariant(
  type?: string,
  variant?: 'default' | 'search' | 'password' | 'checkbox' | 'radio' | 'textarea' | null
): 'default' | 'search' | 'password' | 'checkbox' | 'radio' | 'textarea' | null {
  if (variant) return variant

  switch (type) {
    case 'checkbox':
      return 'checkbox'
    case 'radio':
      return 'radio'
    case 'search':
      return 'search'
    case 'password':
      return 'password'
    default:
      return 'default'
  }
}

/**
 * Détermine la taille automatiquement pour les inputs checkables
 */
export function getAutoSize(
  type?: string,
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'checkbox' | 'radio' | null
): 'default' | 'sm' | 'lg' | 'xl' | 'checkbox' | 'radio' | null {
  if (size) return size

  if (type === 'checkbox') return 'checkbox'
  if (type === 'radio') return 'radio'

  return 'default'
}

/**
 * Vérifie si un type d'input est checkable
 */
export function isCheckableType(type?: string): boolean {
  return type === 'checkbox' || type === 'radio'
}

/**
 * Parse les props numériques (min, max, step) pour les convertir en number
 */
export function parseNumericProps(props: {
  min?: number | string
  max?: number | string
  step?: number | string
}): {
  min?: number
  max?: number
  step?: number
} {
  return {
    min: typeof props.min === 'number' ? props.min : Number.parseFloat(props.min as string) || undefined,
    max: typeof props.max === 'number' ? props.max : Number.parseFloat(props.max as string) || undefined,
    step: typeof props.step === 'number' ? props.step : Number.parseFloat(props.step as string) || undefined,
  }
}

/**
 * Crée un événement synthétique pour déclencher onChange programmatiquement
 */
export function createSyntheticEvent(value: string): ChangeEvent<HTMLInputElement> {
  return {
    target: { value },
  } as ChangeEvent<HTMLInputElement>
}
