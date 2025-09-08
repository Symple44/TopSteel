/**
 * 📋 AUDIT & TRACKING - TopSteel ERP
 * Types pour l'audit et le suivi des actions
 */

import type { BaseEntity } from '../core'

/**
 * Types d'actions auditées
 */
export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUBMIT = 'SUBMIT',
  CANCEL = 'CANCEL',
}

/**
 * Ressources auditées
 */
export enum AuditResource {
  USER = 'User',
  CLIENT = 'Client',
  PROJET = 'Projet',
  ORDRE_FABRICATION = 'OrdreFabrication',
  OPERATION = 'Operation',
  DEVIS = 'Devis',
  FACTURE = 'Facture',
  STOCK = 'Stock',
  MOUVEMENT = 'Mouvement',
  NOTIFICATION = 'Notification',
  SYSTEM = 'System',
}

/**
 * Entrée d'audit principal
 */
export interface AuditLogEntry extends BaseEntity {
  userId: string
  userEmail?: string
  action: AuditActionType
  resource: AuditResource
  resourceId?: string
  resourceName?: string
  description?: string
  changes?: AuditChange[]
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success: boolean
  errorMessage?: string
  duration?: number // en millisecondes
}

/**
 * Changement dans l'audit
 */
export interface AuditChange {
  field: string
  oldValue: any
  newValue: any
  fieldType?: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
}

/**
 * Configuration d'audit pour une ressource
 */
export interface AuditConfig {
  resource: AuditResource
  enabled: boolean
  actions: AuditActionType[]
  trackChanges: boolean
  sensitiveFields?: string[] // champs sensibles à masquer
  retentionDays?: number
  alertOnActions?: AuditActionType[]
}

/**
 * Filtre pour les logs d'audit
 */
export interface AuditLogFilters {
  userId?: string
  action?: AuditActionType[]
  resource?: AuditResource[]
  resourceId?: string
  dateDebut?: Date
  dateFin?: Date
  success?: boolean
  ipAddress?: string
  search?: string
}

/**
 * Rapport d'audit
 */
export interface AuditReport {
  period: {
    debut: Date
    fin: Date
  }
  summary: {
    totalActions: number
    uniqueUsers: number
    successRate: number
    mostActiveUsers: Array<{
      userId: string
      userEmail: string
      actionCount: number
    }>
    actionsByType: Record<AuditActionType, number>
    actionsByResource: Record<AuditResource, number>
  }
  timeline: Array<{
    date: string
    actionCount: number
    uniqueUsers: number
  }>
  suspiciousActivities: AuditLogEntry[]
}

/**
 * Activité suspecte détectée
 */
export interface SuspiciousActivity {
  id: string
  userId: string
  type: 'MULTIPLE_FAILED_LOGINS' | 'UNUSUAL_HOURS' | 'MASS_DELETION' | 'PRIVILEGE_ESCALATION'
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  detected: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
  relatedLogEntries: string[] // IDs des entrées d'audit
}
