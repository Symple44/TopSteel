// apps/web/src/components/layout/sidebar/types.ts
import type React from 'react'

export interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | string
  badge?: string
  gradient?: string
  customIconColor?: string
  children?: NavItem[]
  roles?: string[]
  isFavorite?: boolean
  isPinned?: boolean
  isCustomized?: boolean
}

export interface DynamicMenuItem {
  userPreferences?: {
    customTitle?: string
    customIcon?: string
    customBadge?: string
    customColor?: string
    isFavorite?: boolean
    isPinned?: boolean
  }
  titleKey?: string
  icon?: string
  badge?: string
  gradient?: string
  type?: string
  href?: string
  path?: string
  id?: string
  title: string // Made required to match TranslatableMenuItem
  roles?: string[]
  children?: DynamicMenuItem[]
  // Additional properties for different menu types
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
}
