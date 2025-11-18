import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Prisma, UserSession } from '@prisma/client'

// Type helpers for UserSession with relations
export type SessionWithUser = Prisma.UserSessionGetPayload<{
  include: {
    user: true
  }
}>

export type SessionComplete = Prisma.UserSessionGetPayload<{
  include: {
    user: true
    forcedLogoutByUser: true
  }
}>

/**
 * SessionPrismaService - Phase 6.3
 *
 * Service de gestion des sessions utilisateur utilisant Prisma
 *
 * Fonctionnalités:
 * - CRUD sessions
 * - Gestion état session (active, idle, logged out)
 * - Forced logout avec raison
 * - Cleanup sessions expirées
 * - Activity tracking (lastActivity, warningCount)
 * - Device et location tracking
 */
@Injectable()
export class SessionPrismaService {
  private readonly logger = new Logger(SessionPrismaService.name)
  private readonly SESSION_TIMEOUT_MINUTES = 30
  private readonly IDLE_TIMEOUT_MINUTES = 15

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // SESSION CRUD OPERATIONS
  // ============================================

  /**
   * Créer une nouvelle session
   */
  async createSession(data: {
    userId: string
    sessionId: string
    accessToken: string
    refreshToken?: string
    ipAddress?: string
    userAgent?: string
    deviceInfo?: Prisma.InputJsonValue
    location?: Prisma.InputJsonValue
    metadata?: Prisma.InputJsonValue
  }): Promise<UserSession> {
    this.logger.log(`Creating session for user: ${data.userId}`)

    try {
      const now = new Date()

      const session = await this.prisma.userSession.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          loginTime: now,
          lastActivity: now,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          deviceInfo: data.deviceInfo,
          location: data.location,
          metadata: data.metadata,
          isActive: true,
          isIdle: false,
          status: 'active',
          warningCount: 0,
        },
      })

      this.logger.log(`Session created successfully: ${session.id}`)
      return session
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating session: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une session par ID
   */
  async findSessionById(id: string, includeUser = false): Promise<UserSession | SessionWithUser | null> {
    this.logger.debug(`Finding session: ${id}`)

    try {
      if (includeUser) {
        return await this.prisma.userSession.findUnique({
          where: { id },
          include: {
            user: true,
          },
        })
      }

      return await this.prisma.userSession.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding session: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une session par sessionId
   */
  async findBySessionId(sessionId: string): Promise<UserSession | null> {
    this.logger.debug(`Finding session by sessionId: ${sessionId}`)

    try {
      return await this.prisma.userSession.findUnique({
        where: { sessionId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding session by sessionId: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les sessions d'un utilisateur
   */
  async findUserSessions(
    userId: string,
    activeOnly = true
  ): Promise<UserSession[]> {
    this.logger.debug(`Finding sessions for user: ${userId}`)

    try {
      const where: Prisma.UserSessionWhereInput = { userId }

      if (activeOnly) {
        where.isActive = true
        where.logoutTime = null
      }

      return await this.prisma.userSession.findMany({
        where,
        orderBy: { lastActivity: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding user sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour l'activité d'une session
   */
  async updateActivity(sessionId: string): Promise<UserSession> {
    this.logger.debug(`Updating activity for session: ${sessionId}`)

    try {
      return await this.prisma.userSession.update({
        where: { sessionId },
        data: {
          lastActivity: new Date(),
          isIdle: false,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating session activity: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer une session comme idle
   */
  async markAsIdle(sessionId: string): Promise<UserSession> {
    this.logger.log(`Marking session as idle: ${sessionId}`)

    try {
      return await this.prisma.userSession.update({
        where: { sessionId },
        data: {
          isIdle: true,
          status: 'idle',
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error marking session as idle: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Incrémenter le compteur d'avertissements
   */
  async incrementWarningCount(sessionId: string): Promise<UserSession> {
    this.logger.log(`Incrementing warning count for session: ${sessionId}`)

    try {
      const session = await this.findBySessionId(sessionId)
      if (!session) {
        throw new NotFoundException('Session non trouvée')
      }

      return await this.prisma.userSession.update({
        where: { sessionId },
        data: {
          warningCount: session.warningCount + 1,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error incrementing warning count: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // SESSION LOGOUT
  // ============================================

  /**
   * Déconnecter une session (logout)
   */
  async logout(sessionId: string): Promise<UserSession> {
    this.logger.log(`Logging out session: ${sessionId}`)

    try {
      const now = new Date()

      return await this.prisma.userSession.update({
        where: { sessionId },
        data: {
          logoutTime: now,
          isActive: false,
          status: 'logged_out',
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error logging out session: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Forcer la déconnexion d'une session par un admin
   */
  async forceLogout(
    sessionId: string,
    forcedBy: string,
    reason: string
  ): Promise<UserSession> {
    this.logger.log(`Force logout session ${sessionId} by ${forcedBy}`)

    try {
      const now = new Date()

      return await this.prisma.userSession.update({
        where: { sessionId },
        data: {
          logoutTime: now,
          isActive: false,
          status: 'forced_logout',
          forcedLogoutBy: forcedBy,
          forcedLogoutReason: reason,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error force logging out session: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Révoquer toutes les sessions d'un utilisateur
   */
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    this.logger.log(`Revoking all sessions for user: ${userId}`)

    try {
      const now = new Date()
      const where: Prisma.UserSessionWhereInput = {
        userId,
        isActive: true,
      }

      if (exceptSessionId) {
        where.sessionId = { not: exceptSessionId }
      }

      const result = await this.prisma.userSession.updateMany({
        where,
        data: {
          logoutTime: now,
          isActive: false,
          status: 'revoked',
        },
      })

      this.logger.log(`Revoked ${result.count} sessions for user ${userId}`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error revoking user sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // SESSION CLEANUP
  // ============================================

  /**
   * Nettoyer les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    this.logger.log('Cleaning up expired sessions')

    try {
      const expirationTime = new Date()
      expirationTime.setMinutes(expirationTime.getMinutes() - this.SESSION_TIMEOUT_MINUTES)

      const result = await this.prisma.userSession.updateMany({
        where: {
          isActive: true,
          lastActivity: {
            lt: expirationTime,
          },
        },
        data: {
          isActive: false,
          status: 'expired',
          logoutTime: new Date(),
        },
      })

      this.logger.log(`Cleaned up ${result.count} expired sessions`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error cleaning up expired sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Marquer les sessions inactives comme idle
   */
  async markIdleSessions(): Promise<number> {
    this.logger.log('Marking idle sessions')

    try {
      const idleTime = new Date()
      idleTime.setMinutes(idleTime.getMinutes() - this.IDLE_TIMEOUT_MINUTES)

      const result = await this.prisma.userSession.updateMany({
        where: {
          isActive: true,
          isIdle: false,
          lastActivity: {
            lt: idleTime,
          },
        },
        data: {
          isIdle: true,
          status: 'idle',
        },
      })

      this.logger.log(`Marked ${result.count} sessions as idle`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error marking idle sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les sessions anciennes (hard delete)
   */
  async deleteOldSessions(daysOld = 30): Promise<number> {
    this.logger.log(`Deleting sessions older than ${daysOld} days`)

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await this.prisma.userSession.deleteMany({
        where: {
          OR: [
            {
              logoutTime: {
                lt: cutoffDate,
              },
            },
            {
              isActive: false,
              createdAt: {
                lt: cutoffDate,
              },
            },
          ],
        },
      })

      this.logger.log(`Deleted ${result.count} old sessions`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting old sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Récupérer les statistiques des sessions
   */
  async getStats(): Promise<{
    total: number
    active: number
    idle: number
    loggedOut: number
    averageSessionDuration: number
  }> {
    this.logger.debug('Getting session statistics')

    try {
      const [total, active, idle, loggedOut] = await Promise.all([
        this.prisma.userSession.count(),
        this.prisma.userSession.count({ where: { isActive: true, isIdle: false } }),
        this.prisma.userSession.count({ where: { isIdle: true } }),
        this.prisma.userSession.count({ where: { isActive: false } }),
      ])

      // Calculer la durée moyenne des sessions (en minutes)
      const recentSessions = await this.prisma.userSession.findMany({
        where: {
          logoutTime: { not: null },
        },
        select: {
          loginTime: true,
          logoutTime: true,
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      })

      let totalDuration = 0
      let sessionCount = 0

      for (const session of recentSessions) {
        if (session.logoutTime) {
          const duration = session.logoutTime.getTime() - session.loginTime.getTime()
          totalDuration += duration
          sessionCount++
        }
      }

      const averageSessionDuration = sessionCount > 0
        ? Math.round(totalDuration / sessionCount / 1000 / 60) // en minutes
        : 0

      return {
        total,
        active,
        idle,
        loggedOut,
        averageSessionDuration,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting session stats: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les sessions actives d'un utilisateur
   */
  async countActiveSessions(userId: string): Promise<number> {
    this.logger.debug(`Counting active sessions for user: ${userId}`)

    try {
      return await this.prisma.userSession.count({
        where: {
          userId,
          isActive: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting active sessions: ${err.message}`, err.stack)
      throw error
    }
  }
}
