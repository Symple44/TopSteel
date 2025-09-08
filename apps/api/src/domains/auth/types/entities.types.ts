/**
 * Types pour éviter les dépendances circulaires entre les entités du domaine auth
 */

export interface IRole {
  id: string
  name: string
  description?: string
  societeId?: string
  parentRoleType?: string
  isActive: boolean
  priority: number
  isSystemRole: boolean
  metadata?: Record<string, unknown>
  rolePermissions?: IRolePermission[]
}

export interface IPermission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
  societeId?: string
  isActive: boolean
  scope: string
  metadata?: Record<string, unknown>
}

export interface IRolePermission {
  id: string
  roleId: string
  role: IRole
  permissionId: string
  permission: IPermission
  isGranted: boolean
  accessLevel: 'BLOCKED' | 'READ' | 'WRITE' | 'DELETE' | 'ADMIN'
  conditions?: Record<string, unknown>
  isActive: boolean
}

export interface IGroup {
  id: string
  name: string
  description: string
  type: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'
  isActive: boolean
  roles?: IRole[]
}

export interface IUserGroup {
  id: string
  userId: string
  groupId: string
  group: IGroup
  isActive: boolean
  assignedAt: Date
  expiresAt?: Date
  assignedBy: string
}
