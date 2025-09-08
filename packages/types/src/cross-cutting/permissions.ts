/**
 * 🔐 PERMISSIONS & ACCESS CONTROL - TopSteel ERP
 * Types pour les permissions et contrôle d'accès
 */

/**
 * Actions possibles dans le système
 */
export enum Permission {
  // Permissions utilisateur
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Permissions client
  CLIENT_VIEW = 'client:view',
  CLIENT_CREATE = 'client:create',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  CLIENT_EXPORT = 'client:export',

  // Permissions projet
  PROJECT_VIEW = 'project:view',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_ASSIGN = 'project:assign',
  PROJECT_MANAGE_DOCUMENTS = 'project:manage_documents',

  // Permissions production
  PRODUCTION_VIEW = 'production:view',
  PRODUCTION_CREATE = 'production:create',
  PRODUCTION_UPDATE = 'production:update',
  PRODUCTION_DELETE = 'production:delete',
  PRODUCTION_START = 'production:start',
  PRODUCTION_COMPLETE = 'production:complete',
  PRODUCTION_PLAN = 'production:plan',

  // Permissions facturation
  BILLING_VIEW = 'billing:view',
  BILLING_CREATE = 'billing:create',
  BILLING_UPDATE = 'billing:update',
  BILLING_DELETE = 'billing:delete',
  BILLING_APPROVE = 'billing:approve',
  BILLING_SEND = 'billing:send',

  // Permissions stock
  STOCK_VIEW = 'stock:view',
  STOCK_UPDATE = 'stock:update',
  STOCK_MANAGE_MOVEMENTS = 'stock:manage_movements',
  STOCK_INVENTORY = 'stock:inventory',

  // Permissions système
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_AUDIT = 'system:audit',
  SYSTEM_BACKUP = 'system:backup',
}

/**
 * Ressources du système
 */
export enum Resource {
  USER = 'User',
  CLIENT = 'Client',
  PROJECT = 'Project',
  PRODUCTION = 'Production',
  BILLING = 'Billing',
  STOCK = 'Stock',
  SYSTEM = 'System',
}

/**
 * Actions génériques
 */
export enum Action {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

/**
 * Vérification de permission
 */
export interface PermissionCheck {
  resource: Resource
  action: Action
  context?: Record<string, unknown>
}

/**
 * Contexte de permission (ex: ressource spécifique, équipe, etc.)
 */
export interface PermissionContext {
  resourceId?: string
  ownerId?: string
  teamId?: string
  organizationId?: string
  metadata?: Record<string, unknown>
}

/**
 * Règle de permission
 */
export interface PermissionRule {
  id: string
  name: string
  resource: Resource
  action: Action
  conditions?: PermissionCondition[]
  effect: 'ALLOW' | 'DENY'
  priority: number
}

/**
 * Condition pour une règle de permission
 */
export interface PermissionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than'
  value: any
}

/**
 * Rôle avec permissions
 */
export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  rules?: PermissionRule[]
  isSystem: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Assignment de rôle à un utilisateur
 */
export interface RoleAssignment {
  id: string
  userId: string
  roleId: string
  context?: PermissionContext
  grantedBy: string
  grantedAt: Date
  expiresAt?: Date
  isActive: boolean
}

/**
 * Résultat d'une vérification de permission
 */
export interface PermissionResult {
  granted: boolean
  reason?: string
  context?: PermissionContext
  appliedRules?: PermissionRule[]
}

/**
 * Requête de vérification de permissions multiples
 */
export interface BulkPermissionCheck {
  userId: string
  checks: PermissionCheck[]
  context?: PermissionContext
}

/**
 * Résultat de vérification de permissions multiples
 */
export interface BulkPermissionResult {
  results: Record<string, PermissionResult>
  hasAllPermissions: boolean
  hasAnyPermission: boolean
}
