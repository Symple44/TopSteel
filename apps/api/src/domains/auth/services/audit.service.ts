/**
 * Service migré de TypeORM vers Prisma
 * Migration complète vers Prisma Client
 */

import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'

/**
 * Types d'événements d'audit
 */
export enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // MFA
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_VERIFIED = 'MFA_VERIFIED',
  MFA_FAILED = 'MFA_FAILED',

  // Authorization
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REVOKED = 'ROLE_REVOKED',

  // Data Access
  DATA_VIEWED = 'DATA_VIEWED',
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_EXPORTED = 'DATA_EXPORTED',

  // Security
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Administration
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
}

/**
 * Niveaux de sévérité
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Entrée d'audit
 */
export interface AuditEntry {
  id?: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: string
  userEmail?: string
  societeId?: string
  siteId?: string
  resource?: string
  action?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success: boolean
  errorCode?: string
  errorMessage?: string
  metadata?: Record<string, unknown>
  duration?: number // Milliseconds
  affectedRecords?: number
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  location?: {
    country?: string
    region?: string
    city?: string
    latitude?: number
    longitude?: number
  }
}

/**
 * Filtre pour recherche d'audit
 */
export interface AuditFilter {
  startDate?: Date
  endDate?: Date
  userId?: string
  societeId?: string
  eventTypes?: AuditEventType[]
  severities?: AuditSeverity[]
  success?: boolean
  resource?: string
  searchTerm?: string
  limit?: number
  offset?: number
}

/**
 * Statistiques d'audit
 */
export interface AuditStatistics {
  totalEvents: number
  byEventType: Record<string, number>
  bySeverity: Record<string, number>
  failureRate: number
  avgDuration: number

  topUsers: Array<{ userId: string; count: number }>
  topResources: Array<{ resource: string; count: number }>
  suspiciousActivities: number
  timeDistribution: Array<{ hour: number; count: number }>
}

/**
 * Service d'audit pour tracer toutes les opérations de sécurité
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)
  private readonly auditQueue: AuditEntry[] = []
  private readonly BATCH_SIZE = 100
  private readonly FLUSH_INTERVAL = 5000 // 5 seconds
  private flushTimer?: NodeJS.Timeout

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: OptimizedCacheService
  ) {
    this.startBatchProcessor()
  }

  /**
   * Enregistre un événement d'audit
   */
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditEntry = {
      ...entry,
      timestamp: new Date(),
    }

    // Déterminer la sévérité automatiquement si non fournie
    if (!auditEntry.severity) {
      auditEntry.severity = this.determineSeverity(auditEntry)
    }

    // Ajouter à la queue
    this.auditQueue.push(auditEntry)

    // Émettre un événement pour les alertes temps réel
    if (auditEntry.severity === AuditSeverity.CRITICAL) {
      this.eventEmitter.emit('audit.critical', auditEntry)
    }

    // Flush si la queue est pleine
    if (this.auditQueue.length >= this.BATCH_SIZE) {
      await this.flush()
    }

    // Log localement pour debug
    this.logger.debug(
      `Audit: ${auditEntry.eventType} - ${auditEntry.success ? 'SUCCESS' : 'FAILED'}`
    )
  }

  /**
   * Enregistre un accès accordé
   */
  async logAccessGranted(
    userId: string,
    resource: string,
    action: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.ACCESS_GRANTED,
      severity: AuditSeverity.INFO,
      userId,
      resource,
      action,
      success: true,
      metadata,
    })
  }

  /**
   * Enregistre un accès refusé
   */
  async logAccessDenied(
    userId: string,
    resource: string,
    action: string,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.ACCESS_DENIED,
      severity: AuditSeverity.WARNING,
      userId,
      resource,
      action,
      success: false,
      errorMessage: reason,
      metadata,
    })
  }

  /**
   * Enregistre une connexion réussie
   */
  async logLoginSuccess(
    userId: string,
    userEmail: string,
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.LOGIN_SUCCESS,
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      sessionId,
      success: true,
      metadata,
    })
  }

  /**
   * Enregistre une tentative de connexion échouée
   */
  async logLoginFailed(
    userEmail: string,
    ipAddress: string,
    userAgent: string,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.LOGIN_FAILED,
      severity: AuditSeverity.WARNING,
      userEmail,
      ipAddress,
      userAgent,
      success: false,
      errorMessage: reason,
      metadata,
    })
  }

  /**
   * Enregistre une activité suspecte
   */
  async logSuspiciousActivity(
    userId: string,
    activity: string,
    ipAddress: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.CRITICAL,
      userId,
      ipAddress,
      success: false,
      errorMessage: activity,
      metadata,
    })

    // Alerter immédiatement
    this.eventEmitter.emit('security.alert', {
      type: 'suspicious_activity',
      userId,
      activity,
      ipAddress,
      timestamp: new Date(),
    })
  }

  /**
   * Enregistre un changement de données
   */
  async logDataChange(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const eventTypeMap = {
      CREATE: AuditEventType.DATA_CREATED,
      UPDATE: AuditEventType.DATA_UPDATED,
      DELETE: AuditEventType.DATA_DELETED,
    }

    await this.log({
      eventType: eventTypeMap[action],
      severity: action === 'DELETE' ? AuditSeverity.WARNING : AuditSeverity.INFO,
      userId,
      resource,
      resourceId,
      action,
      success: true,
      oldValue,
      newValue,
      metadata,
    })
  }

  /**
   * Enregistre un changement de permission
   */
  async logPermissionChange(
    userId: string,
    targetUserId: string,
    societeId: string,
    permissions: {
      added?: string[]
      removed?: string[]
      restricted?: string[]
    },
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType: AuditEventType.PERMISSION_CHANGED,
      severity: AuditSeverity.WARNING,
      userId,
      societeId,
      success: true,
      metadata: {
        targetUserId,
        permissions,
        ...metadata,
      },
    })
  }

  /**
   * Recherche dans les logs d'audit
   */
  async search(filter: AuditFilter): Promise<{
    entries: AuditEntry[]
    total: number
  }> {
    // Build where clause
    const where: any = {}

    if (filter.startDate) {
      where.timestamp = { ...where.timestamp, gte: filter.startDate }
    }

    if (filter.endDate) {
      where.timestamp = { ...where.timestamp, lte: filter.endDate }
    }

    if (filter.userId) {
      where.userId = filter.userId
    }

    if (filter.societeId) {
      where.societeId = filter.societeId
    }

    if (filter.eventTypes?.length) {
      where.eventType = { in: filter.eventTypes }
    }

    if (filter.severities?.length) {
      where.severity = { in: filter.severities }
    }

    if (filter.success !== undefined) {
      where.success = filter.success
    }

    if (filter.resource) {
      where.resource = filter.resource
    }

    if (filter.searchTerm) {
      where.OR = [
        { userEmail: { contains: filter.searchTerm, mode: 'insensitive' } },
        { errorMessage: { contains: filter.searchTerm, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const total = await this.prisma.auditLog.count({ where })

    // Get paginated results
    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: filter.offset || 0,
      take: filter.limit || 100,
    })

    // Map to AuditEntry - Note: Schema has limited fields, using what's available
    const entries: AuditEntry[] = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      eventType: (log.action as AuditEventType) || AuditEventType.DATA_VIEWED,
      severity: AuditSeverity.INFO, // Schema doesn't have severity
      userId: log.userId || undefined,
      societeId: log.societeId || undefined,
      resource: log.resource || undefined,
      action: log.action || undefined,
      resourceId: log.resourceId || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      success: true, // Schema doesn't have success field
      metadata: (log.metadata as Record<string, unknown>) || undefined,
    }))

    return { entries, total }
  }

  /**
   * Obtient les statistiques d'audit
   */
  async getStatistics(
    startDate: Date,
    endDate: Date,
    societeId?: string
  ): Promise<AuditStatistics> {
    const cacheKey = `audit_stats:${startDate.getTime()}:${endDate.getTime()}:${societeId || 'all'}`

    // Vérifier le cache
    const cached = await this.cacheService.get<AuditStatistics>(cacheKey)
    if (cached) {
      return cached
    }

    // Build base where clause
    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    }

    if (societeId) {
      where.societeId = societeId
    }

    // Total des événements
    const totalEvents = await this.prisma.auditLog.count({ where })

    // Par type d'événement (using action field)
    const byEventTypeRaw = await this.prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
      SELECT "action" as type, COUNT(*) as count
      FROM "audit_logs"
      WHERE "created_at" BETWEEN ${startDate} AND ${endDate}
      ${societeId ? this.prisma.$queryRaw`AND "societe_id" = ${societeId}` : this.prisma.$queryRaw``}
      GROUP BY "action"
    `

    // Pas de sévérité dans le schéma - on retourne des valeurs par défaut
    const bySeverityRaw: Array<{ severity: string; count: bigint }> = []

    // Pas de champ success - on retourne 0
    const failureRate = 0

    // Pas de champ duration - on retourne 0
    const avgDuration = 0

    // Top utilisateurs
    const topUsersRaw = await this.prisma.$queryRaw<Array<{ userId: string; count: bigint }>>`
      SELECT "user_id" as "userId", COUNT(*) as count
      FROM "audit_logs"
      WHERE "created_at" BETWEEN ${startDate} AND ${endDate}
      ${societeId ? this.prisma.$queryRaw`AND "societe_id" = ${societeId}` : this.prisma.$queryRaw``}
      AND "user_id" IS NOT NULL
      GROUP BY "user_id"
      ORDER BY count DESC
      LIMIT 10
    `

    // Top ressources
    const topResourcesRaw = await this.prisma.$queryRaw<Array<{ resource: string; count: bigint }>>`
      SELECT "resource", COUNT(*) as count
      FROM "audit_logs"
      WHERE "created_at" BETWEEN ${startDate} AND ${endDate}
      ${societeId ? this.prisma.$queryRaw`AND "societe_id" = ${societeId}` : this.prisma.$queryRaw``}
      AND "resource" IS NOT NULL
      GROUP BY "resource"
      ORDER BY count DESC
      LIMIT 10
    `

    // Pas de field eventType - on compte 0
    const suspiciousActivities = 0

    // Distribution temporelle
    const timeDistributionRaw = await this.prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT EXTRACT(HOUR FROM "created_at")::int as hour, COUNT(*) as count
      FROM "audit_logs"
      WHERE "created_at" BETWEEN ${startDate} AND ${endDate}
      ${societeId ? this.prisma.$queryRaw`AND "societe_id" = ${societeId}` : this.prisma.$queryRaw``}
      GROUP BY hour
      ORDER BY hour ASC
    `

    const statistics: AuditStatistics = {
      totalEvents,
      byEventType: byEventTypeRaw.reduce((acc, item) => {
        acc[item.type] = Number(item.count)
        return acc
      }, {} as Record<string, number>),
      bySeverity: bySeverityRaw.reduce((acc, item) => {
        acc[item.severity] = Number(item.count)
        return acc
      }, {} as Record<string, number>),
      failureRate,
      avgDuration,
      topUsers: topUsersRaw.map((u) => ({
        userId: u.userId,
        count: Number(u.count),
      })),
      topResources: topResourcesRaw.map((r) => ({
        resource: r.resource,
        count: Number(r.count),
      })),
      suspiciousActivities,
      timeDistribution: timeDistributionRaw.map((t) => ({
        hour: t.hour,
        count: Number(t.count),
      })),
    }

    // Mettre en cache pour 5 minutes
    await this.cacheService.set(cacheKey, statistics, 300)

    return statistics
  }

  /**
   * Nettoie les anciens logs d'audit
   */
  async cleanup(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    })

    this.logger.log(
      `Cleaned up ${result.count} audit log entries older than ${retentionDays} days`
    )

    return result.count
  }

  /**
   * Détecte les anomalies dans les patterns d'audit
   */
  async detectAnomalies(
    userId: string,
    windowMinutes: number = 30
  ): Promise<{
    hasAnomalies: boolean
    anomalies: string[]
  }> {
    const windowStart = new Date()
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes)

    const recentActivity = await this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: 'desc' },
    })

    const anomalies: string[] = []

    // Détection d'anomalies - Schema doesn't have eventType, using action instead
    const failedLogins = recentActivity.filter(
      (a) => a.action === 'LOGIN_FAILED'
    ).length

    if (failedLogins > 5) {
      anomalies.push(`${failedLogins} failed login attempts in ${windowMinutes} minutes`)
    }

    const deniedAccess = recentActivity.filter(
      (a) => a.action === 'ACCESS_DENIED'
    ).length

    if (deniedAccess > 10) {
      anomalies.push(`${deniedAccess} access denied events in ${windowMinutes} minutes`)
    }

    // Vérifier les changements de localisation rapides
    const uniqueIPs = new Set(recentActivity.map((a) => a.ipAddress).filter(Boolean))
    if (uniqueIPs.size > 3) {
      anomalies.push(`Activity from ${uniqueIPs.size} different IP addresses`)
    }

    // Vérifier l'activité inhabituelle
    const unusualHours = recentActivity.filter((a) => {
      const hour = a.createdAt.getHours()
      return hour < 6 || hour > 22 // Activité en dehors des heures normales
    })

    if (unusualHours.length > recentActivity.length * 0.5) {
      anomalies.push('Unusual activity outside normal hours')
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
    }
  }

  /**
   * Détermine la sévérité automatiquement
   */
  private determineSeverity(entry: AuditEntry): AuditSeverity {
    // Événements critiques
    const criticalEvents = [AuditEventType.SUSPICIOUS_ACTIVITY, AuditEventType.RATE_LIMIT_EXCEEDED]

    if (criticalEvents.includes(entry.eventType)) {
      return AuditSeverity.CRITICAL
    }

    // Événements d'erreur
    if (!entry.success) {
      return AuditSeverity.ERROR
    }

    // Événements d'avertissement
    const warningEvents = [
      AuditEventType.ACCESS_DENIED,
      AuditEventType.LOGIN_FAILED,
      AuditEventType.MFA_FAILED,
      AuditEventType.DATA_DELETED,
      AuditEventType.PERMISSION_CHANGED,
      AuditEventType.ROLE_REVOKED,
    ]

    if (warningEvents.includes(entry.eventType)) {
      return AuditSeverity.WARNING
    }

    // Par défaut: INFO
    return AuditSeverity.INFO
  }

  /**
   * Démarre le processeur de batch
   */
  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => {
      if (this.auditQueue.length > 0) {
        this.flush().catch((error) => {
          this.logger.error('Error flushing audit queue:', error)
        })
      }
    }, this.FLUSH_INTERVAL)
  }

  /**
   * Flush la queue d'audit vers la base de données
   */
  private async flush(): Promise<void> {
    if (this.auditQueue.length === 0) {
      return
    }

    const entries = [...this.auditQueue]
    this.auditQueue.length = 0

    try {
      await this.prisma.auditLog.createMany({
        data: entries.map((entry) => {
          const data: any = {
            userId: entry.userId || null,
            societeId: entry.societeId || null,
            action: entry.action || entry.eventType,
            resource: entry.resource || 'unknown',
            resourceId: entry.resourceId || null,
            description: entry.errorMessage || null,
            ipAddress: entry.ipAddress || null,
            userAgent: entry.userAgent || null,
            metadata: entry.metadata || {},
          }

          // Only add changes if there are values
          if (entry.oldValue || entry.newValue) {
            data.changes = JSON.parse(JSON.stringify({ old: entry.oldValue, new: entry.newValue }))
          }

          return data
        }),
      })
      this.logger.debug(`Flushed ${entries.length} audit entries to database`)
    } catch (error) {
      this.logger.error('Failed to save audit entries:', error)
      // Remettre les entrées dans la queue en cas d'erreur
      this.auditQueue.unshift(...entries)
    }
  }

  /**
   * Arrête le service proprement
   */
  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    await this.flush()
  }
}
