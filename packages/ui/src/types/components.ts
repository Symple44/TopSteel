// packages/ui/src/types/components.ts - Types robustes pour composants UI
import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Types de base réutilisables
export type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
export type Size = 'default' | 'sm' | 'lg' | 'icon'

// Props de base pour tous les composants
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

// Props pour les composants Button
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseComponentProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  loadingText?: string
}

// Props pour les composants avec états
export interface StatefulComponentProps extends BaseComponentProps {
  disabled?: boolean
  error?: boolean
  loading?: boolean
}

// Types pour les événements
export type EventHandler<T = Event> = (event: T) => void
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

// Types pour les données
export type DataRecord = Record<string, unknown>
export type ApiResponse<T = unknown> = {
  data: T
  success: boolean
  message?: string
  errors?: string[]
}

// Types pour les hooks
export interface UseToggleReturn {
  value: boolean
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
}

export interface UseAsyncReturn<T = unknown> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: () => Promise<void>
}
