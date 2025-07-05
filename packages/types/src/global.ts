/**
 * 🌐 TYPES GLOBAUX ULTRA-SÛRS - TOPSTEEL ERP
 * Version minimale sans risque d'erreur de syntaxe
 */

// Types utilitaires de base
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type WithId<T> = T & { id: string }

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

// Types design system
export type DesignSystemVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
export type DesignSystemSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'  
export type DesignSystemTheme = 'light' | 'dark' | 'system'

// Interface de base pour validation
export interface ValidationSchema<T = unknown> {
  required?: boolean
  type?: 'string' | 'number' | 'boolean'
  minLength?: number
  maxLength?: number
}