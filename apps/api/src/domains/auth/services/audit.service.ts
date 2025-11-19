import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { AuditLog } from '../core/entities/audit-log.entity'
import { AuditLog } from '@prisma/client'

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
    @InjectRepository(AuditLog, 'auth')
    private readonly auditLogRepository: Repository<AuditLog>,
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
    const query = this.auditLogRepository.createQueryBuilder('audit')

    // Appliquer les filtres
    if (filter.startDate) {
      query.andWhere('audit.timestamp >= :startDate', { startDate: filter.startDate })
    }

    if (filter.endDate) {
      query.andWhere('audit.timestamp <= :endDate', { endDate: filter.endDate })
    }

    if (filter.userId) {
      query.andWhere('audit.userId = :userId', { userId: filter.userId })
    }

    if (filter.societeId) {
      query.andWhere('audit.societeId = :societeId', { societeId: filter.societeId })
    }

    if (filter.eventTypes?.length) {
      query.andWhere('audit.eventType IN (:...eventTypes)', { eventTypes: filter.eventTypes })
    }

    if (filter.severities?.length) {
      query.andWhere('audit.severity IN (:...severities)', { severities: filter.severities })
    }

    if (filter.success !== undefined) {
      query.andWhere('audit.success = :success', { success: filter.success })
    }

    if (filter.resource) {
      query.andWhere('audit.resource = :resource', { resource: filter.resource })
    }

    if (filter.searchTerm) {
      query.andWhere(
        '(audit.userEmail ILIKE :search OR audit.errorMessage ILIKE :search OR audit.metadata::text ILIKE :search)',
        { search: `%${filter.searchTerm}%` }
      )
    }

    // Pagination
    const total = await query.getCount()

    if (filter.limit) {
      query.limit(filter.limit)
    }

    if (filter.offset) {
      query.offset(filter.offset)
    }

    // Ordre par défaut
    query.orderBy('audit.timestamp', 'DESC')

    const logs = await query.getMany()

    // Map AuditLog to AuditEntry
    const entries: AuditEntry[] = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      eventType: log.eventType as AuditEventType,
      severity: log.severity as AuditSeverity,
      userId: log.userId,
      userEmail: log.userEmail,
      societeId: log.societeId,
      siteId: log.siteId,
      resource: log.resource,
      action: log.action,
      details: log.metadata, // Use metadata as details
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
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

    const baseQuery = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })

    if (societeId) {
      baseQuery.andWhere('audit.societeId = :societeId', { societeId })
    }

    // Total des événements
    const totalEvents = await baseQuery.getCount()

    // Par type d'événement
    const byEventType = await baseQuery
      .select('audit.eventType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.eventType')
      .getRawMany()

    // Par sévérité
    const bySeverity = await baseQuery
      .select('audit.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.severity')
      .getRawMany()

    // Taux d'échec
    const failures = await baseQuery.andWhere('audit.success = false').getCount()
    const failureRate = totalEvents > 0 ? (failures / totalEvents) * 100 : 0

    // Durée moyenne
    const avgDurationResult = await baseQuery.select('AVG(audit.duration)', 'avg').getRawOne()
    const avgDuration = avgDurationResult?.avg || 0

    // Top utilisateurs
    const topUsers = await baseQuery
      .select('audit.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.userId')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    // Top ressources
    const topResources = await baseQuery
      .select('audit.resource', 'resource')
      .addSelect('COUNT(*)', 'count')
      .where('audit.resource IS NOT NULL')
      .groupBy('audit.resource')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    // Activités suspectes
    const suspiciousActivities = await baseQuery
      .andWhere('audit.eventType = :suspicious', {
        suspicious: AuditEventType.SUSPICIOUS_ACTIVITY,
      })
      .getCount()

    // Distribution temporelle
    const timeDistribution = await baseQuery
      .select('EXTRACT(HOUR FROM audit.timestamp)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany()

    const statistics: AuditStatistics = {
      totalEvents,
      byEventType: byEventType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count, 10)
        return acc
      }, {}),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = parseInt(item.count, 10)
        return acc
      }, {}),
      failureRate,
      avgDuration,
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        count: parseInt(u.count, 10),
      })),
      topResources: topResources.map((r) => ({
        resource: r.resource,
        count: parseInt(r.count, 10),
      })),
      suspiciousActivities,
      timeDistribution: timeDistribution.map((t) => ({
        hour: parseInt(t.hour, 10),
        count: parseInt(t.count, 10),
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

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute()

    this.logger.log(
      `Cleaned up ${result.affected} audit log entries older than ${retentionDays} days`
    )

    return result.affected || 0
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

    const recentActivity = await this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.userId = :userId', { userId })
      .andWhere('audit.timestamp >= :windowStart', { windowStart })
      .orderBy('audit.timestamp', 'DESC')
      .getMany()

    const anomalies: string[] = []

    // Détection d'anomalies
    const failedLogins = recentActivity.filter(
      (a) => a.eventType === AuditEventType.LOGIN_FAILED
    ).length

    if (failedLogins > 5) {
      anomalies.push(`${failedLogins} failed login attempts in ${windowMinutes} minutes`)
    }

    const deniedAccess = recentActivity.filter(
      (a) => a.eventType === AuditEventType.ACCESS_DENIED
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
      const hour = a.timestamp.getHours()
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
      await this.auditLogRepository.save(entries)
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
