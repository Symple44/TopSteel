// packages/ui/src/components/primitives/input/Input.tsx - VERSION CORRIGÉE
// Modifications minimales pour supporter number/string automatiquement

import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../../../lib/utils'

// === VARIANTS POUR INPUT ENRICHI (votre structure existante) ===
const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'h-9 px-3 py-1',
        checkbox:
          'h-4 w-4 shrink-0 rounded-sm border-primary shadow focus-visible:ring-1 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        radio:
          'h-4 w-4 shrink-0 rounded-full border-primary shadow focus-visible:ring-1 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        search: 'h-9 px-3 py-1 pl-10', // Espace pour icône de recherche
        password: 'h-9 px-3 py-1 pr-10', // Espace pour bouton toggle
      },
      size: {
        default: 'h-9 px-3 py-1',
        sm: 'h-8 px-2 text-xs',
        lg: 'h-10 px-4 text-base',
        checkbox: 'h-4 w-4',
        radio: 'h-4 w-4',
      },
      state: {
        default: '',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
        warning: 'border-amber-500 focus-visible:ring-amber-500',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  }
)

// === INTERFACE ENRICHIE (votre interface + support numérique) ===
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'>,
    VariantProps<typeof inputVariants> {
  // ✅ MODIFIÉ: Support automatique des valeurs string ET number
  value?: string | number

  // ✅ onChange typé qui gère automatiquement la conversion
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void

  // ✅ Props pour inputs checkables (votre code existant)
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void

  // ✅ Props pour état actif/inactif (votre code existant)
  active?: boolean
  onActiveChange?: (active: boolean) => void

  // ✅ Props pour validation (votre code existant)
  error?: boolean | string
  success?: boolean
  warning?: boolean

  // ✅ Props numériques (votre code existant)
  min?: number | string
  max?: number | string
  step?: number | string

  // ✅ Props pour formatage (votre code existant)
  precision?: number // Pour les nombres décimaux

  // ✅ Props d'amélioration UX (votre code existant)
  clearable?: boolean
  onClear?: () => void

  // ✅ Icon support (votre code existant)
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode

  // ✅ Loading state (votre code existant)
  loading?: boolean
}

// === COMPOSANT INPUT ENRICHI ===
const Input = React.forwardRef<HTMLInputElement, InputProps>(
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
      min,
      max,
      step,
      precision,
      clearable,
      onClear,
      startIcon,
      endIcon,
      loading,
      value,
      ...props
    },
    ref
  ) => {
    // ✅ Détermine l'état visuel (votre code existant)
    const visualState = error ? 'error' : success ? 'success' : warning ? 'warning' : state

    // ✅ Gestion des types checkables (votre code existant)
    const isCheckable = type === 'checkbox' || type === 'radio'

    // ✅ Détermine la variante automatiquement (votre code existant)
    const finalVariant =
      variant ||
      (type === 'checkbox'
        ? 'checkbox'
        : type === 'radio'
          ? 'radio'
          : type === 'search'
            ? 'search'
            : type === 'password'
              ? 'password'
              : 'default')

    const finalSize = size || (isCheckable ? (type as 'checkbox' | 'radio') : 'default')

    // ✅ NOUVEAU: Conversion automatique number → string
    const displayValue = React.useMemo(() => {
      if (value === undefined || value === null) return ''
      if (typeof value === 'number') {
        if (type === 'number' && precision !== undefined) {
          return value.toFixed(precision)
        }
        return value.toString()
      }
      return String(value)
    }, [value, type, precision])

    // ✅ Handler pour les changements avec formatage (amélioré)
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target

        // ✅ Gestion spécifique pour les inputs checkables (votre code existant)
        if (isCheckable && onCheckedChange) {
          onCheckedChange(target.checked)
        }

        // ✅ Gestion de l'état actif (votre code existant)
        if (onActiveChange) {
          onActiveChange(target.checked || target.value !== '')
        }

        // ✅ Handler original (maintenant l'appelant n'a plus besoin de conversion)
        onChange?.(e)
      },
      [onChange, isCheckable, onCheckedChange, onActiveChange]
    )

    // ✅ Props pour les inputs checkables (votre code existant)
    const checkableProps = isCheckable
      ? {
          checked: checked,
          defaultChecked: defaultChecked,
        }
      : {}

    // ✅ Props numériques (votre code existant amélioré)
    const numericProps =
      type === 'number'
        ? {
            min: typeof min === 'number' ? min : Number.parseFloat(min as string) || undefined,
            max: typeof max === 'number' ? max : Number.parseFloat(max as string) || undefined,
            step: typeof step === 'number' ? step : Number.parseFloat(step as string) || undefined,
          }
        : {}

    // ✅ Pour les inputs avec icônes, on wrap dans un container (votre code existant)
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
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              aria-label="Chargement en cours"
            >
              <div
                className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"
                role="status"
                aria-hidden="true"
              ></div>
            </div>
          )}

          {/* Input principal */}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: finalVariant, size: finalSize, state: visualState }),
              // ✅ Ajustements pour les icônes
              startIcon && 'pl-10',
              (endIcon || clearable || loading) && 'pr-10',
              // ✅ Classes conditionnelles pour l'état actif
              active && 'ring-2 ring-primary ring-offset-2',
              isCheckable && checked && 'bg-primary text-primary-foreground',
              className
            )}
            ref={ref}
            value={displayValue} // ✅ MODIFIÉ: Utilise la valeur convertie automatiquement
            onChange={handleChange}
            {...checkableProps}
            {...numericProps}
            {...props}
          />

          {/* Bouton clear */}
          {clearable && displayValue && !loading && (
            <button
              type="button"
              onClick={() => {
                onClear?.()
                // Déclenche aussi onChange avec une valeur vide
                const syntheticEvent = {
                  target: { value: '' },
                } as React.ChangeEvent<HTMLInputElement>
                onChange?.(syntheticEvent)
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
            </button>
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

    // ✅ Input simple sans icônes (votre code existant)
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
        value={displayValue} // ✅ MODIFIÉ: Utilise la valeur convertie automatiquement
        onChange={handleChange}
        {...checkableProps}
        {...numericProps}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

// === COMPOSANTS DE CONVENANCE (vos composants existants) ===

// ✅ Input numérique avec validation (votre composant existant)
export const NumberInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type'> & {
    min?: number
    max?: number
    step?: number
    precision?: number
    allowNegative?: boolean
  }
>(({ min = 0, max, step = 1, precision = 2, allowNegative = false, ...props }, ref) => (
  <Input
    type="number"
    min={allowNegative ? undefined : min}
    max={max}
    step={step}
    precision={precision}
    ref={ref}
    {...props}
  />
))

NumberInput.displayName = 'NumberInput'

// ✅ Input de recherche avec icône (votre composant existant)
export const SearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type' | 'startIcon'>
>(({ placeholder = 'Rechercher...', clearable = true, ...props }, ref) => (
  <Input
    type="search"
    variant="search"
    placeholder={placeholder}
    clearable={clearable}
    startIcon={
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
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    }
    ref={ref}
    {...props}
  />
))

SearchInput.displayName = 'SearchInput'

// ✅ Input de mot de passe avec toggle (votre composant existant)
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type' | 'endIcon'>
>(({ ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <Input
      type={showPassword ? 'text' : 'password'}
      variant="password"
      endIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      }
      ref={ref}
      {...props}
    />
  )
})

PasswordInput.displayName = 'PasswordInput'

export const CheckboxInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ ...props }, ref) => <Input type="checkbox" ref={ref} {...props} />
)

CheckboxInput.displayName = 'CheckboxInput'

export const RadioInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ ...props }, ref) => <Input type="radio" ref={ref} {...props} />
)

RadioInput.displayName = 'RadioInput'

export { Input }
