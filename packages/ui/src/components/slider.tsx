/**
 * 🎚️ SLIDER COMPONENT - TOPSTEEL ERP UI
 * Composant slider robuste basé sur Radix UI
 *
 * Fonctionnalités:
 * - Typage TypeScript strict et correct
 * - Support multi-valeurs
 * - Accessibilité complète
 * - Thème adaptatif
 * - Validation des valeurs
 */

import * as SliderPrimitive from '@radix-ui/react-slider'
import * as React from 'react'
import { cn } from '@/lib/utils'

// =============================================
// TYPES ET INTERFACES
// =============================================

export interface SliderProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    'value' | 'defaultValue' | 'onValueChange'
  > {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  inverted?: boolean

  // ERP spécifique
  label?: string
  description?: string
  showValue?: boolean
  formatValue?: (value: number) => string
  variant?: 'default' | 'range' | 'stepped'
  size?: 'sm' | 'md' | 'lg'
  required?: boolean

  // Validation
  validator?: (values: number[]) => boolean
  errorMessage?: string
}

// =============================================
// HELPERS ET UTILITAIRES
// =============================================

const getSliderSizeClasses = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizes = {
    sm: {
      track: 'h-1',
      thumb: 'h-3 w-3',
      range: 'h-full',
    },
    md: {
      track: 'h-2',
      thumb: 'h-5 w-5',
      range: 'h-full',
    },
    lg: {
      track: 'h-3',
      thumb: 'h-6 w-6',
      range: 'h-full',
    },
  }

  return sizes[size]
}

const formatDefaultValue = (value: number): string => {
  return value.toString()
}

const validateSliderValue = (
  values: number[],
  min: number = 0,
  max: number = 100,
  validator?: (values: number[]) => boolean
): boolean => {
  // Validation des bornes
  const withinBounds = values.every((val) => val >= min && val <= max)

  // Validation personnalisée
  const customValid = validator ? validator(values) : true

  return withinBounds && customValid
}

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      orientation = 'horizontal',
      disabled = false,
      inverted = false,
      label,
      description,
      showValue = false,
      formatValue = formatDefaultValue,
      variant = 'default',
      size = 'md',
      validator,
      errorMessage,
      ...props
    },
    ref
  ) => {
    // État local pour la validation
    const [isValid, setIsValid] = React.useState(true)
    const [internalValue, setInternalValue] = React.useState<number[]>(defaultValue || [min])

    // Valeur contrôlée ou non contrôlée
    const currentValue = value !== undefined ? value : internalValue

    // Classes de taille
    const sizeClasses = getSliderSizeClasses(size)

    // Handler pour le changement de valeur
    const handleValueChange = React.useCallback(
      (newValue: number[]) => {
        // Validation
        const valid = validateSliderValue(newValue, min, max, validator)

        setIsValid(valid)

        // Mise à jour de l'état interne si non contrôlé
        if (value === undefined) {
          setInternalValue(newValue)
        }

        // Appel du callback externe
        if (onValueChange && valid) {
          onValueChange(newValue)
        }
      },
      [value, min, max, validator, onValueChange]
    )

    // Classes CSS calculées
    const rootClasses = cn(
      'relative flex w-full touch-none select-none items-center',
      orientation === 'vertical' && 'h-full flex-col',
      disabled && 'opacity-50 cursor-not-allowed',
      !isValid && 'opacity-75',
      className
    )

    const trackClasses = cn(
      'relative grow overflow-hidden rounded-full bg-secondary',
      sizeClasses.track,
      orientation === 'vertical' && 'w-2 h-full',
      !isValid && 'bg-destructive/20'
    )

    const rangeClasses = cn(
      'absolute bg-primary',
      sizeClasses.range,
      variant === 'range' && 'bg-gradient-to-r from-primary to-primary/80',
      variant === 'stepped' && 'bg-primary',
      !isValid && 'bg-destructive'
    )

    const thumbClasses = cn(
      'block rounded-full border-2 border-primary bg-background',
      'ring-offset-background transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      sizeClasses.thumb,
      !isValid && 'border-destructive',
      !disabled && 'hover:scale-110 active:scale-95'
    )

    // ID pour l'accessibilité
    const sliderId = React.useId()
    const descriptionId = description ? `${sliderId}-description` : undefined

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={sliderId}
            className={cn(
              'text-sm font-medium leading-none',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              !isValid && 'text-destructive'
            )}
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        {/* Slider */}
        <SliderPrimitive.Root
          ref={ref}
          id={sliderId}
          className={rootClasses}
          value={currentValue}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          orientation={orientation}
          disabled={disabled}
          inverted={inverted}
          aria-describedby={descriptionId}
          aria-invalid={!isValid}
          {...props}
        >
          <SliderPrimitive.Track className={trackClasses}>
            <SliderPrimitive.Range className={rangeClasses} />
          </SliderPrimitive.Track>

          {currentValue.map((_, index) => (
            <SliderPrimitive.Thumb key={index} className={thumbClasses} />
          ))}
        </SliderPrimitive.Root>

        {/* Affichage des valeurs */}
        {showValue && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatValue(min)}</span>
            <div className="flex gap-2">
              {currentValue.map((val, index) => (
                <span key={index} className={cn('font-medium', !isValid && 'text-destructive')}>
                  {formatValue(val)}
                </span>
              ))}
            </div>
            <span>{formatValue(max)}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {/* Message d'erreur */}
        {!isValid && errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
      </div>
    )
  }
)

Slider.displayName = SliderPrimitive.Root.displayName

// =============================================
// COMPOSANTS SPÉCIALISÉS
// =============================================

/**
 * Slider de plage (range) avec deux valeurs
 */
export const RangeSlider = React.forwardRef<
  React.ElementRef<typeof Slider>,
  Omit<SliderProps, 'defaultValue' | 'value'> & {
    defaultValue?: [number, number]
    value?: [number, number]
    onValueChange?: (value: [number, number]) => void
  }
>(({ defaultValue = [0, 50], ...props }, ref) => {
  return <Slider ref={ref} variant="range" defaultValue={defaultValue} {...props} />
})

RangeSlider.displayName = 'RangeSlider'

/**
 * Slider avec marqueurs pour des valeurs spécifiques
 */
export const SteppedSlider = React.forwardRef<
  React.ElementRef<typeof Slider>,
  SliderProps & {
    marks?: Array<{ value: number; label?: string }>
  }
>(({ marks = [], ...props }, ref) => {
  return (
    <div className="space-y-1">
      <Slider ref={ref} variant="stepped" {...props} />

      {marks.length > 0 && (
        <div className="relative">
          {marks.map((mark, index) => {
            const percentage =
              ((mark.value - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100

            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${percentage}%` }}
              >
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                {mark.label && (
                  <span className="text-xs text-muted-foreground block text-center mt-1 whitespace-nowrap">
                    {mark.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

SteppedSlider.displayName = 'SteppedSlider'

// =============================================
// EXPORTS
// =============================================

export { Slider }
