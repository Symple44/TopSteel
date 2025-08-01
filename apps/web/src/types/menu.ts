// Types pour le système de menus

export interface MenuItem {
  id?: string
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
