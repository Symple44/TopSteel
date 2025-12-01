'use client'

// packages/ui/src/components/primitives/input/Input.tsx
// Composant Input de base - version modulaire

import type { ButtonHTMLAttributes, ChangeEvent } from 'react'
import { forwardRef, useCallback, useMemo } from 'react'
import { buttonVariants, inputVariants } from '../../../variants'
import { cn } from '../../../lib/utils'
import type { InputBaseProps } from './types'
import {
  formatDisplayValue,
  getVisualState,
  getAutoVariant,
  getAutoSize,
  isCheckableType,
  parseNumericProps,
  createSyntheticEvent,
} from './utils'

/**
 * Composant Button interne pour les actions dans l'input
 */
interface InternalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const InternalButton = forwardRef<HTMLButtonElement, InternalButtonProps>(
  ({ className, variant = 'ghost', size = 'icon', ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    )
  }
)

InternalButton.displayName = 'InternalButton'

/**
 * Composant Input de base
 *
 * Supporte:
 * - États de validation (error, success, warning)
 * - Icônes de début et de fin (startIcon, endIcon)
 * - État de chargement (loading)
 * - Bouton clear optionnel (clearable)
 * - Support automatique des valeurs string et number
 * - Inputs checkables (checkbox, radio)
 */
export const Input = forwardRef<HTMLInputElement, InputBaseProps>(
  (
    {
      className,
      variant,
      size,
      state,
      type,
      checked,
      defaultChecked,
      onCheckedChange,
      active,
      onActiveChange,
      onChange,
      error,
      success,
      warning,
      clearable,
      onClear,
      startIcon,
      endIcon,
      loading,
      value,
      min,
      max,
      step,
      ...props
    },
    ref
  ) => {
    // Détermine l'état visuel
    const visualState = getVisualState(error, success, warning, state)

    // Gestion des types checkables
    const isCheckable = isCheckableType(type)

    // Détermine la variante et la taille automatiquement
    const finalVariant = getAutoVariant(type, variant)
    const finalSize = getAutoSize(type, size)

    // Conversion automatique number → string pour l'affichage
    const displayValue = useMemo(
      () => formatDisplayValue(value, type, undefined),
      [value, type]
    )

    // Handler pour les changements
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const target = e.target

        // Gestion spécifique pour les inputs checkables
        if (isCheckable && onCheckedChange) {
          onCheckedChange(target.checked)
        }

        // Gestion de l'état actif
        if (onActiveChange) {
          onActiveChange(target.checked || target.value !== '')
        }

        // Handler original
        onChange?.(e)
      },
      [onChange, isCheckable, onCheckedChange, onActiveChange]
    )

    // Props pour les inputs checkables
    const checkableProps = isCheckable
      ? {
          checked: checked,
          defaultChecked: defaultChecked,
        }
      : {}

    // Props numériques (si type="number")
    const numericProps = type === 'number' ? parseNumericProps({ min, max, step }) : {}

    // Si on a des icônes ou un bouton clear, on wrap dans un container
    if (startIcon || endIcon || clearable || loading) {
      return (
        <div className="relative">
          {/* Icône de début */}
          {startIcon && (
            <div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            >
              {startIcon}
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <output
              className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full block"
              aria-label="Chargement en cours"
            />
          )}

          {/* Input principal */}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: finalVariant, size: finalSize, state: visualState }),
              // Ajustements pour les icônes
              startIcon && 'pl-10',
              (endIcon || clearable || loading) && 'pr-10',
              // Classes conditionnelles pour l'état actif
              active && 'ring-2 ring-primary ring-offset-2',
              isCheckable && checked && 'bg-primary text-primary-foreground',
              className
            )}
            ref={ref}
            value={displayValue}
            onChange={handleChange}
            {...checkableProps}
            {...numericProps}
            {...props}
          />

          {/* Bouton clear */}
          {clearable && displayValue && !loading && (
            <InternalButton
              type="button"
              onClick={() => {
                onClear?.()
                // Déclenche aussi onChange avec une valeur vide
                onChange?.(createSyntheticEvent(''))
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer le contenu"
              title="Effacer le contenu"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </InternalButton>
          )}

          {/* Icône de fin */}
          {endIcon && !clearable && !loading && (
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            >
              {endIcon}
            </div>
          )}
        </div>
      )
    }

    // Input simple sans icônes
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ variant: finalVariant, size: finalSize, state: visualState }),
          active && 'ring-2 ring-primary ring-offset-2',
          isCheckable && checked && 'bg-primary text-primary-foreground',
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        {...checkableProps}
        {...numericProps}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
