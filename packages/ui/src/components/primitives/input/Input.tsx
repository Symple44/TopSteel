'use client'

// packages/ui/src/components/primitives/input/Input.tsx - VERSION CORRIGÉE
// Modifications minimales pour supporter number/string automatiquement

import { cva, type VariantProps } from 'class-variance-authority'
import {
  type ButtonHTMLAttributes,
  type ChangeEvent,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { buttonVariants } from '../../../design-system/variants'
import { cn } from '../../../lib/utils'

// === VARIANTS POUR INPUT ENRICHI ===
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

// === INTERFACE ENRICHIE ===
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'>,
    VariantProps<typeof inputVariants> {
  // ✅ Support automatique des valeurs string ET number
  value?: string | number

  // ✅ onChange typé qui gère automatiquement la conversion
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void

  // ✅ Props pour inputs checkables
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void

  // ✅ Props pour état actif/inactif
  active?: boolean
  onActiveChange?: (active: boolean) => void

  // ✅ Props pour validation
  error?: boolean | string
  success?: boolean
  warning?: boolean

  // ✅ Props numériques
  min?: number | string
  max?: number | string
  step?: number | string

  // ✅ Props pour formatage
  precision?: number // Pour les nombres décimaux

  // ✅ Props d'amélioration UX
  clearable?: boolean
  onClear?: () => void

  // ✅ Icon support
  startIcon?: ReactNode
  endIcon?: ReactNode

  // ✅ Loading state
  loading?: boolean
}

// === COMPOSANT BUTTON INTÉGRÉ ===
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

// === COMPOSANT INPUT ENRICHI ===
const Input = forwardRef<HTMLInputElement, InputProps>(
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
    // ✅ Détermine l'état visuel
    const visualState = error ? 'error' : success ? 'success' : warning ? 'warning' : state

    // ✅ Gestion des types checkables
    const isCheckable = type === 'checkbox' || type === 'radio'

    // ✅ Détermine la variante automatiquement
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

    // ✅ Conversion automatique number → string
    const displayValue = useMemo(() => {
      if (value === undefined || value === null) return ''
      if (typeof value === 'number') {
        if (type === 'number' && precision !== undefined) {
          return value.toFixed(precision)
        }
        return value.toString()
      }
      return String(value)
    }, [value, type, precision])

    // ✅ Handler pour les changements avec formatage
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const target = e.target

        // ✅ Gestion spécifique pour les inputs checkables
        if (isCheckable && onCheckedChange) {
          onCheckedChange(target.checked)
        }

        // ✅ Gestion de l'état actif
        if (onActiveChange) {
          onActiveChange(target.checked || target.value !== '')
        }

        // ✅ Handler original
        onChange?.(e)
      },
      [onChange, isCheckable, onCheckedChange, onActiveChange]
    )

    // ✅ Props pour les inputs checkables
    const checkableProps = isCheckable
      ? {
          checked: checked,
          defaultChecked: defaultChecked,
        }
      : {}

    // ✅ Props numériques
    const numericProps =
      type === 'number'
        ? {
            min: typeof min === 'number' ? min : Number.parseFloat(min as string) || undefined,
            max: typeof max === 'number' ? max : Number.parseFloat(max as string) || undefined,
            step: typeof step === 'number' ? step : Number.parseFloat(step as string) || undefined,
          }
        : {}

    // ✅ Pour les inputs avec icônes, on wrap dans un container
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
              />
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
                const syntheticEvent = {
                  target: { value: '' },
                } as ChangeEvent<HTMLInputElement>
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

    // ✅ Input simple sans icônes
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

// === COMPOSANTS DE CONVENANCE ===

// ✅ Input numérique avec validation
export const NumberInput = forwardRef<
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

// ✅ Input de recherche avec icône
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'startIcon'>>(
  ({ placeholder = 'Rechercher...', clearable = true, ...props }, ref) => (
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
  )
)

SearchInput.displayName = 'SearchInput'

// ✅ Input de mot de passe avec toggle
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'endIcon'>>(
  ({ ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <Input
        type={showPassword ? 'text' : 'password'}
        variant="password"
        endIcon={
          <InternalButton
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
          </InternalButton>
        }
        ref={ref}
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export const CheckboxInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ ...props }, ref) => <Input type="checkbox" ref={ref} {...props} />
)

CheckboxInput.displayName = 'CheckboxInput'

export const RadioInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ ...props }, ref) => <Input type="radio" ref={ref} {...props} />
)

RadioInput.displayName = 'RadioInput'

export { Input }
