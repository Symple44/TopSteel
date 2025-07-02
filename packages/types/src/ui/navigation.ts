import type { ComponentType } from 'react'
export interface NavItem {
  title: string
  href?: string
  icon?: ComponentType
  children?: NavItem[]
  roles?: string[]
  permissions?: string[]
  badge?: string | number
}

export interface BreadcrumbItem {
  label: string
  href?: string
}