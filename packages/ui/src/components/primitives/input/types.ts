'use client'

// packages/ui/src/components/primitives/input/types.ts
// Types et interfaces partagés pour les composants Input

import type { VariantProps } from 'class-variance-authority'
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'
import { inputVariants } from '../../../variants'

/**
 * Props de base pour tous les inputs
 */
export interface InputBaseProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'>,
    VariantProps<typeof inputVariants> {
  // Support automatique des valeurs string ET number
  value?: string | number

  // onChange typé qui gère automatiquement la conversion
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void

  // Props pour inputs checkables
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void

  // Props pour état actif/inactif
  active?: boolean
  onActiveChange?: (active: boolean) => void

  // Props pour validation
  error?: boolean | string
  success?: boolean
  warning?: boolean

  // Icon support
  startIcon?: ReactNode
  endIcon?: ReactNode

  // Loading state
  loading?: boolean

  // Clearable support
  clearable?: boolean
  onClear?: () => void
}

/**
 * Props pour le NumberInput
 */
export interface NumberInputProps extends Omit<InputBaseProps, 'type'> {
  min?: number
  max?: number
  step?: number
  precision?: number
  allowNegative?: boolean
}

/**
 * Props pour le SearchInput
 */
export interface SearchInputProps extends Omit<InputBaseProps, 'type' | 'startIcon'> {
  onSearch?: (value: string) => void
}

/**
 * Props pour le PasswordInput
 */
export interface PasswordInputProps extends Omit<InputBaseProps, 'type' | 'endIcon'> {
  showToggle?: boolean
}
