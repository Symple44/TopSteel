// packages/types/src/admin.ts
import type { BaseEntity } from './common'
import type { User } from './user'

export interface SystemSetting extends BaseEntity {
  category: string
  key: string
  value: any
  description?: string
  updatedBy?: string
  updatedByUser?: User
}

export interface AuditLog extends BaseEntity {
  userId?: string
  user?: User
  action: string
  entityType: string
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'fr' | 'en'
  dateFormat: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sound: boolean
    categories: Record<string, boolean>
  }
  dashboard: {
    layout: 'grid' | 'list'
    widgets: string[]
    refreshInterval: number
  }
  preferences: Record<string, any>
}

export interface UserPermissions {
  modules: {
    projets: ('read' | 'write' | 'delete')[]
    production: ('read' | 'write' | 'delete')[]
    stocks: ('read' | 'write' | 'delete')[]
    clients: ('read' | 'write' | 'delete')[]
    facturation: ('read' | 'write' | 'delete')[]
    admin: ('read' | 'write' | 'delete')[]
  }
  features: {
    canExportData: boolean
    canImportData: boolean
    canManageUsers: boolean
    canViewReports: boolean
    canConfigureSystem: boolean
    canAccessAuditLogs: boolean
  }
}

export interface SecurityConfig {
  passwordMinLength: number
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  maxLoginAttempts: number
  lockoutDuration: number // en minutes
  sessionTimeout: number // en minutes
  twoFactorEnabled: boolean
  ipWhitelist: string[]
}

export interface EmailConfig {
  enabled: boolean
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  fromEmail: string
  fromName: string
}

export interface BackupConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  retention: number // nombre de sauvegardes à conserver
  location: 'local' | 's3' | 'ftp'
  encryption: boolean
}

// Requests
export interface CreateUserRequest {
  email: string
  nom: string
  prenom: string
  role: string
  password: string
  actif?: boolean
  settings?: UserSettings
  permissions?: UserPermissions
}

export interface UpdateUserRequest {
  email?: string
  nom?: string
  prenom?: string
  role?: string
  actif?: boolean
  settings?: UserSettings
  permissions?: UserPermissions
}

export interface SystemSettingsRequest {
  [category: string]: {
    [key: string]: any
  }
}

export interface AdminFilters {
  module?: string
  action?: string
  userId?: string
  entityType?: string
  dateDebut?: Date
  dateFin?: Date
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  connectedToday: number
  adminUsers: number
  totalActions: number
  failedLogins: number
  systemHealth: {
    database: 'healthy' | 'warning' | 'critical'
    api: 'healthy' | 'warning' | 'critical'
    storage: 'healthy' | 'warning' | 'critical'
  }
}