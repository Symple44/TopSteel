'use client'

// packages/ui/src/components/primitives/input/deprecated.tsx
// Composants dépréciés pour rétrocompatibilité

import { forwardRef } from 'react'
import { Input } from './Input'
import type { InputBaseProps } from './types'

/**
 * @deprecated Utilisez <Checkbox /> depuis primitives/checkbox à la place
 */
export const CheckboxInput = forwardRef<HTMLInputElement, Omit<InputBaseProps, 'type'>>(
  (props, ref) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'CheckboxInput is deprecated. Use <Checkbox /> from primitives/checkbox instead.'
      )
    }
    return <Input type="checkbox" ref={ref} {...props} />
  }
)

CheckboxInput.displayName = 'CheckboxInput'

/**
 * @deprecated Utilisez <RadioGroup /> depuis primitives/radio-group à la place
 */
export const RadioInput = forwardRef<HTMLInputElement, Omit<InputBaseProps, 'type'>>(
  (props, ref) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'RadioInput is deprecated. Use <RadioGroup /> from primitives/radio-group instead.'
      )
    }
    return <Input type="radio" ref={ref} {...props} />
  }
)

RadioInput.displayName = 'RadioInput'
