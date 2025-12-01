'use client'

// packages/ui/src/components/primitives/input/NumberInput.tsx
// Composant NumberInput - Input numérique avec validation et formatage

import { forwardRef, useMemo } from 'react'
import { Input } from './Input'
import type { NumberInputProps } from './types'
import { formatDisplayValue } from './utils'

/**
 * Input numérique avec validation et formatage
 *
 * Fonctionnalités:
 * - Min/max validation
 * - Step increment
 * - Precision (nombre de décimales)
 * - Support des nombres négatifs (optionnel)
 * - Formatage automatique des valeurs
 *
 * @example
 * ```tsx
 * <NumberInput
 *   min={0}
 *   max={100}
 *   step={1}
 *   precision={2}
 *   allowNegative={false}
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      min = 0,
      max,
      step = 1,
      precision = 2,
      allowNegative = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    // Formate la valeur avec la precision si spécifiée
    const formattedValue = useMemo(() => {
      if (value === undefined || value === null || value === '') return value

      const numValue = typeof value === 'number' ? value : Number.parseFloat(String(value))

      if (Number.isNaN(numValue)) return value

      return formatDisplayValue(numValue, 'number', precision)
    }, [value, precision])

    return (
      <Input
        type="number"
        min={allowNegative ? undefined : min}
        max={max}
        step={step}
        value={formattedValue}
        onChange={onChange}
        ref={ref}
        {...props}
      />
    )
  }
)

NumberInput.displayName = 'NumberInput'
