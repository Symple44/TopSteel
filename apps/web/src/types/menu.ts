// Types pour le système de menus

export interface MenuItem {
  id: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  icon?: string
  orderIndex: number
  isVisible: boolean
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  children: MenuItem[]
  // Nouveaux champs pour les droits
  allowedGroups?: string[]
  requiredRoles?: string[]
  requiredPermissions?: string[]
  inheritFromParent?: boolean
  isPublic?: boolean
  // Additional optional properties
  badge?: string | number
  href?: string
  // Additional properties for UI components
  customIcon?: string
  customIconColor?: string
}

export interface MenuType {
  value: string
  label: string
  description: string
  icon: string
  canHaveChildren: boolean
  requiredFields: string[]
}

export interface Group {
  id: string
  name: string
  description: string
  type: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'
  isActive: boolean
}

export interface Role {
  id: string
  name: string
  description: string
  isSystemRole: boolean
  isActive: boolean
}

export interface Permission {
  id: string
  name: string
  description: string
  module: string
  action: string
}

export interface MenuConfiguration {
  id: string // Required id field
  name: string
  description?: string
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt?: string
  createdBy?: string
  items?: MenuItem[]
}

// Additional interfaces for menu settings
export interface UserMenuItem {
  id: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  icon?: string
  orderIndex: number
  isVisible: boolean
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  children?: UserMenuItem[]
  customIcon?: string
  customIconColor?: string
  badge?: string | number
  href?: string
}

export interface MenuItemConfig {
  id: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  icon?: string
  orderIndex: number
  isVisible: boolean
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  children?: MenuItemConfig[]
  customIcon?: string
  customIconColor?: string
}
