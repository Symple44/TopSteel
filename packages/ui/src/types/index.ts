// packages/ui/src/types/index.ts - Types robustes
import { type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes, type ReactNode } from 'react'

// === TYPES DE BASE ===
export interface BaseComponentProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
  asChild?: boolean
}

// === TYPES DE VARIANTES ===
export type ComponentVariants<T> = VariantProps<T>

// === TYPES D'ÉVÉNEMENTS ===
export interface ComponentEvent<T = any> {
  type: string
  data?: T
  timestamp: number
}

// === TYPES MÉTIER ===
export interface ProjetData {
  id: string
  nom: string
  statut: 'draft' | 'active' | 'completed' | 'archived'
  description?: string
  dateCreation: Date
  dateModification: Date
}

// === EXPORTS ===
export type { ClassValue } from 'clsx'
