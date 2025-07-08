import type React from 'react'
// packages/ui/src/types/index.ts
// Types communs pour l'UI
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export type ComponentVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'success'
  | 'warning'

export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ComponentWithVariant {
  variant?: ComponentVariant
}

export interface ComponentWithSize {
  size?: ComponentSize
}

// Types pour les toasts
export interface ToastProps extends BaseComponentProps {
  variant?: ComponentVariant
  duration?: number
  title?: string
  description?: string
}

// Types pour les formulaires
export interface FormFieldProps extends BaseComponentProps {
  error?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

