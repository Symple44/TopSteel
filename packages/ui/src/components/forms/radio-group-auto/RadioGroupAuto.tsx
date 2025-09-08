'use client'

import { forwardRef } from 'react'
import { useRadioGroupIds } from '../../../hooks/useFormFieldIds'
import { cn } from '../../../lib/utils'
import { RadioGroup, RadioGroupItem } from '../../primitives'
import { Label } from '../label/Label'

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupAutoProps {
  /** Current selected value */
  value?: string
  /** Callback when value changes */
  onValueChange?: (value: string) => void
  /** Array of radio options */
  options: RadioOption[]
  /** Name for the radio group (used for ID generation) */
  name: string
  /** Whether the radio group is disabled */
  disabled?: boolean
  /** Additional className for the wrapper */
  className?: string
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * RadioGroupAuto - RadioGroup component with automatic ID management
 *
 * This component:
 * - Generates unique IDs for all radio items automatically
 * - Links labels to radio items properly
 * - Provides consistent spacing and styling
 * - Maintains accessibility standards
 *
 * @example
 * <RadioGroupAuto
 *   name="contact-preference"
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   options={[
 *     { value: 'primary', label: 'Primary Contact' },
 *     { value: 'secondary', label: 'Secondary Contact' }
 *   ]}
 * />
 */
export const RadioGroupAuto = forwardRef<HTMLDivElement, RadioGroupAutoProps>(
  (
    {
      value,
      onValueChange,
      options,
      name,
      disabled,
      className,
      orientation = 'vertical',
      size = 'md',
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for all radio options
    const radioIds = useRadioGroupIds(
      name,
      options.map((opt) => opt.value)
    )

    const sizeClasses = {
      sm: 'space-y-1',
      md: 'space-y-2',
      lg: 'space-y-3',
    }

    const orientationClasses = {
      horizontal: 'flex flex-wrap gap-4',
      vertical: sizeClasses[size],
    }

    return (
      <RadioGroup
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        className={cn(orientationClasses[orientation], className)}
        {...props}
      >
        {options.map((option) => {
          const itemId = radioIds[option.value]
          const isDisabled = disabled || option.disabled

          return (
            <div key={option.value} className="flex items-start space-x-2">
              <RadioGroupItem
                value={option.value}
                id={itemId}
                disabled={isDisabled}
                className="mt-0.5"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={itemId}
                  className={cn(
                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                    isDisabled && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {option.label}
                </Label>
                {option.description && (
                  <p className={cn('text-xs text-muted-foreground', isDisabled && 'opacity-70')}>
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </RadioGroup>
    )
  }
)

RadioGroupAuto.displayName = 'RadioGroupAuto'

export default RadioGroupAuto
