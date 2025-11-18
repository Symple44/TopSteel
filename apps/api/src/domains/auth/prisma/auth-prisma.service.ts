import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import type { User, UserSession, Role, Permission, RolePermission } from '@prisma/client'

/**
 * AuthPrismaService - POC Phase 1.2/1.3
 *
 * Service d'authentification utilisant Prisma pour valider la migration TypeORM → Prisma
 *
 * Entités gérées (5 critiques):
 * - User
 * - UserSession
 * - Role
 * - Permission
 * - RolePermission
 *
 * Fonctionnalités:
 * - CRUD utilisateurs avec bcrypt
 * - Gestion sessions
 * - Gestion rôles/permissions
 * - Validation mot de passe
 */
@Injectable()
export class AuthPrismaService {
  private readonly logger = new Logger(AuthPrismaService.name)
  private readonly BCRYPT_SALT_ROUNDS = 10

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // USER OPERATIONS
  // ============================================

  /**
   * Créer un utilisateur avec hash bcrypt du mot de passe
   */
  async createUser(data: {
    email: string
    password: string
    username: string
    firstName?: string
    lastName?: string
    isActive?: boolean
  }): Promise<Omit<User, 'passwordHash'>> {
    this.logger.log(`Creating user: ${data.email}`)

    const passwordHash = await bcrypt.hash(data.password, this.BCRYPT_SALT_ROUNDS)

    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isEmailVerified: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          acronyme: true,
          version: true,
          refreshToken: true,
          metadata: true,
          passwordHash: false,
        },
      })

      this.logger.log(`User created successfully: ${user.id}`)
      return user
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver un utilisateur par email avec hiérarchie rôles/permissions
   */
  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`)

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!user) {
        this.logger.debug(`User not found: ${email}`)
        return null
      }

      this.logger.debug(`User found: ${user.id}`)
      return user
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding user by email: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver un utilisateur par ID
   */
  async findUserById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${id}`)

    try {
      return await this.prisma.user.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding user by ID: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Valider le mot de passe d'un utilisateur avec bcrypt
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    this.logger.debug(`Validating password for user: ${user.id}`)

    try {
      const isValid = await bcrypt.compare(password, user.passwordHash)
      this.logger.debug(`Password validation result: ${isValid}`)
      return isValid
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error validating password: ${err.message}`, err.stack)
      return false
    }
  }

  // ============================================
  // SESSION OPERATIONS
  // ============================================

  /**
   * Créer une session utilisateur avec tokens
   */
  async createSession(data: {
    userId: string
    sessionId: string
    accessToken: string
    refreshToken?: string
    ipAddress?: string
    userAgent?: string
  }): Promise<UserSession> {
    this.logger.log(`Creating session for user: ${data.userId}`)

    try {
      const session = await this.prisma.userSession.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          loginTime: new Date(),
          lastActivity: new Date(),
          isActive: true,
          status: 'active',
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
   * Trouver une session active par sessionId avec données utilisateur
   */
  async findActiveSession(sessionId: string): Promise<(UserSession & { user: User }) | null> {
    this.logger.debug(`Finding active session: ${sessionId}`)

    try {
      const session = await this.prisma.userSession.findUnique({
        where: { sessionId },
        include: {
          user: true,
        },
      })

      if (!session) {
        this.logger.debug(`Session not found: ${sessionId}`)
        return null
      }

      if (!session.isActive) {
        this.logger.debug(`Session is not active: ${sessionId}`)
        return null
      }

      return session
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding active session: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver une session par accessToken
   */
  async findSessionByToken(accessToken: string): Promise<(UserSession & { user: User }) | null> {
    this.logger.debug(`Finding session by token`)

    try {
      const session = await this.prisma.userSession.findFirst({
        where: {
          accessToken,
          isActive: true,
        },
        include: {
          user: true,
        },
      })

      if (!session) {
        this.logger.debug(`Session not found by token`)
        return null
      }

      return session
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding session by token: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour l'activité d'une session
   */
  async updateSessionActivity(sessionId: string): Promise<UserSession> {
    this.logger.debug(`Updating session activity: ${sessionId}`)

    try {
      const session = await this.prisma.userSession.update({
        where: { sessionId },
        data: {
          lastActivity: new Date(),
        },
      })

      this.logger.debug(`Session activity updated: ${sessionId}`)
      return session
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating session activity: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Terminer une session avec raison de tracking
   */
  async endSession(sessionId: string, reason: string): Promise<UserSession> {
    this.logger.log(`Ending session: ${sessionId}, reason: ${reason}`)

    try {
      const session = await this.prisma.userSession.update({
        where: { sessionId },
        data: {
          isActive: false,
          logoutTime: new Date(),
          forcedLogoutReason: reason,
          status: 'ended',
        },
      })

      this.logger.log(`Session ended successfully: ${sessionId}`)
      return session
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error ending session: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Terminer toutes les sessions d'un utilisateur
   */
  async endAllUserSessions(userId: string, reason: string): Promise<number> {
    this.logger.log(`Ending all sessions for user: ${userId}`)

    try {
      const result = await this.prisma.userSession.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          logoutTime: new Date(),
          forcedLogoutReason: reason,
          status: 'ended',
        },
      })

      this.logger.log(`${result.count} sessions ended for user: ${userId}`)
      return result.count
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error ending user sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // ROLE OPERATIONS
  // ============================================

  /**
   * Créer un rôle avec niveau
   */
  async createRole(data: {
    name: string
    label: string
    description?: string
    level?: number
  }): Promise<Role> {
    this.logger.log(`Creating role: ${data.name}`)

    try {
      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          label: data.label,
          description: data.description || null,
          level: data.level || 0,
        },
      })

      this.logger.log(`Role created successfully: ${role.id}`)
      return role
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver un rôle par nom
   */
  async findRoleByName(name: string): Promise<Role | null> {
    this.logger.debug(`Finding role by name: ${name}`)

    try {
      return await this.prisma.role.findUnique({
        where: { name },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding role by name: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver un rôle par ID avec permissions
   */
  async findRoleById(id: string) {
    this.logger.debug(`Finding role by ID: ${id}`)

    try {
      return await this.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding role by ID: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // PERMISSION OPERATIONS
  // ============================================

  /**
   * Créer une permission
   */
  async createPermission(data: {
    name: string
    label: string
    module: string
    action: string
    resource?: string
    description?: string
  }): Promise<Permission> {
    this.logger.log(`Creating permission: ${data.name}`)

    try {
      const permission = await this.prisma.permission.create({
        data: {
          name: data.name,
          label: data.label,
          module: data.module,
          action: data.action,
          resource: data.resource || null,
          description: data.description || null,
        },
      })

      this.logger.log(`Permission created successfully: ${permission.id}`)
      return permission
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating permission: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Trouver une permission par nom
   */
  async findPermissionByName(name: string): Promise<Permission | null> {
    this.logger.debug(`Finding permission by name: ${name}`)

    try {
      return await this.prisma.permission.findUnique({
        where: { name },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding permission by name: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // ROLE-PERMISSION OPERATIONS
  // ============================================

  /**
   * Assigner une permission à un rôle
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    this.logger.log(`Assigning permission ${permissionId} to role ${roleId}`)

    try {
      const rolePermission = await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      })

      this.logger.log(`Permission assigned successfully`)
      return rolePermission
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error assigning permission to role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Retirer une permission d'un rôle
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<RolePermission> {
    this.logger.log(`Removing permission ${permissionId} from role ${roleId}`)

    try {
      const rolePermission = await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      })

      this.logger.log(`Permission removed successfully`)
      return rolePermission
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error removing permission from role: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Assigner un rôle à un utilisateur
   */
  async assignRoleToUser(userId: string, roleId: string) {
    this.logger.log(`Assigning role ${roleId} to user ${userId}`)

    try {
      const userRole = await this.prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      })

      this.logger.log(`Role assigned successfully`)
      return userRole
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error assigning role to user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Retirer un rôle d'un utilisateur
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    this.logger.log(`Removing role ${roleId} from user ${userId}`)

    try {
      const userRole = await this.prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      })

      this.logger.log(`Role removed successfully`)
      return userRole
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error removing role from user: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  /**
   * Mettre à jour le dernier login d'un utilisateur
   */
  async updateLastLogin(userId: string): Promise<User> {
    this.logger.debug(`Updating last login for user: ${userId}`)

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
        },
      })

      this.logger.debug(`Last login updated: ${userId}`)
      return user
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating last login: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Vérifier si un utilisateur a une permission spécifique
   */
  async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    this.logger.debug(`Checking if user ${userId} has permission ${permissionName}`)

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!user) {
        this.logger.debug(`User not found: ${userId}`)
        return false
      }

      const hasPermission = user.roles.some((userRole) =>
        userRole.role.permissions.some(
          (rolePermission) => rolePermission.permission.name === permissionName
        )
      )

      this.logger.debug(`User has permission: ${hasPermission}`)
      return hasPermission
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error checking user permission: ${err.message}`, err.stack)
      return false
    }
  }

  /**
   * Obtenir toutes les sessions actives (Admin)
   */
  async getAllActiveSessions(): Promise<UserSession[]> {
    this.logger.debug('Getting all active sessions')

    try {
      return await this.prisma.userSession.findMany({
        where: { status: 'active' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { loginTime: 'desc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting active sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir l'historique des connexions avec pagination (Admin)
   */
  async getConnectionHistory(
    limit: number = 100,
    offset: number = 0
  ): Promise<{ sessions: UserSession[]; total: number }> {
    this.logger.debug(`Getting connection history: limit=${limit}, offset=${offset}`)

    try {
      const [sessions, total] = await Promise.all([
        this.prisma.userSession.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { loginTime: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.userSession.count(),
      ])

      this.logger.debug(`Found ${sessions.length} sessions out of ${total} total`)
      return { sessions, total }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting connection history: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir l'historique des connexions d'un utilisateur spécifique (Admin)
   */
  async getUserConnectionHistory(userId: string, limit: number = 50): Promise<UserSession[]> {
    this.logger.debug(`Getting connection history for user: ${userId}`)

    try {
      return await this.prisma.userSession.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { loginTime: 'desc' },
        take: limit,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user connection history: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les sessions actives
   */
  async countActiveSessions(): Promise<number> {
    this.logger.debug('Counting active sessions')

    try {
      return await this.prisma.userSession.count({
        where: { status: 'active' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting active sessions: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les sessions par statut
   */
  async countSessionsByStatus(): Promise<Record<string, number>> {
    this.logger.debug('Counting sessions by status')

    try {
      const sessions = await this.prisma.userSession.groupBy({
        by: ['status'],
        _count: true,
      })

      const result: Record<string, number> = {}
      sessions.forEach((item) => {
        result[item.status] = item._count
      })

      return result
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting sessions by status: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Forcer la déconnexion d'un utilisateur (Admin)
   * Invalide toutes les sessions actives de l'utilisateur
   */
  async forceLogoutUser(
    userId: string,
    adminUserId: string,
    reason: string = 'Déconnexion administrative'
  ): Promise<UserSession[]> {
    this.logger.debug(`Forcing logout for user: ${userId} by admin: ${adminUserId}`)

    try {
      // Récupérer toutes les sessions actives
      const activeSessions = await this.prisma.userSession.findMany({
        where: {
          userId,
          status: 'active',
        },
      })

      // Marquer toutes comme 'forced_logout'
      await this.prisma.userSession.updateMany({
        where: {
          userId,
          status: 'active',
        },
        data: {
          status: 'forced_logout',
          isActive: false,
          logoutTime: new Date(),
          forcedLogoutBy: adminUserId,
          forcedLogoutReason: reason,
        },
      })

      this.logger.log(`Forced logout ${activeSessions.length} sessions for user ${userId}`)
      return activeSessions
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error forcing logout for user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Forcer la déconnexion d'une session spécifique (Admin)
   */
  async forceLogoutSession(
    sessionId: string,
    adminUserId: string,
    reason: string = 'Déconnexion administrative'
  ): Promise<boolean> {
    this.logger.debug(`Forcing logout for session: ${sessionId} by admin: ${adminUserId}`)

    try {
      const session = await this.prisma.userSession.findUnique({
        where: { id: sessionId },
      })

      if (!session || session.status !== 'active') {
        this.logger.warn(`Session ${sessionId} not found or not active`)
        return false
      }

      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: {
          status: 'forced_logout',
          isActive: false,
          logoutTime: new Date(),
          forcedLogoutBy: adminUserId,
          forcedLogoutReason: reason,
        },
      })

      this.logger.log(`Forced logout session ${sessionId}`)
      return true
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error forcing logout for session: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Obtenir les statistiques des sessions (Admin)
   */
  async getSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    expiredSessions: number
    forcedLogouts: number
    normalLogouts: number
    averageSessionDuration: number
    todayLogins: number
    thisWeekLogins: number
    thisMonthLogins: number
  }> {
    this.logger.debug('Getting session statistics')

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [
        totalSessions,
        activeSessions,
        expiredSessions,
        forcedLogouts,
        normalLogouts,
        todayLogins,
        thisWeekLogins,
        thisMonthLogins,
        allSessions,
      ] = await Promise.all([
        this.prisma.userSession.count(),
        this.prisma.userSession.count({ where: { status: 'active' } }),
        this.prisma.userSession.count({ where: { status: 'expired' } }),
        this.prisma.userSession.count({ where: { status: 'forced_logout' } }),
        this.prisma.userSession.count({ where: { status: 'logged_out' } }),
        this.prisma.userSession.count({ where: { loginTime: { gte: todayStart } } }),
        this.prisma.userSession.count({ where: { loginTime: { gte: weekStart } } }),
        this.prisma.userSession.count({ where: { loginTime: { gte: monthStart } } }),
        this.prisma.userSession.findMany({
          where: {
            logoutTime: { not: null },
          },
          select: {
            loginTime: true,
            logoutTime: true,
          },
        }),
      ])

      // Calculer la durée moyenne des sessions (en minutes)
      let averageSessionDuration = 0
      if (allSessions.length > 0) {
        const totalDuration = allSessions.reduce((sum, session) => {
          if (session.logoutTime) {
            const duration = session.logoutTime.getTime() - session.loginTime.getTime()
            return sum + duration
          }
          return sum
        }, 0)
        averageSessionDuration = Math.round(totalDuration / allSessions.length / 1000 / 60) // en minutes
      }

      const stats = {
        totalSessions,
        activeSessions,
        expiredSessions,
        forcedLogouts,
        normalLogouts,
        averageSessionDuration,
        todayLogins,
        thisWeekLogins,
        thisMonthLogins,
      }

      this.logger.debug('Session stats calculated', stats)
      return stats
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting session stats: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Nettoyer les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<{
    redisCleanedCount: number
    databaseCleanedCount: number
  }> {
    this.logger.debug('Cleaning up expired sessions')

    try {
      const now = new Date()
      const expirationThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 heures

      // Marquer les sessions inactives depuis plus de 24h comme expirées
      const result = await this.prisma.userSession.updateMany({
        where: {
          status: 'active',
          lastActivity: { lt: expirationThreshold },
        },
        data: {
          status: 'expired',
          isActive: false,
          logoutTime: now,
          forcedLogoutReason: 'Session expirée automatiquement (inactivité)',
        },
      })

      this.logger.log(`Cleaned up ${result.count} expired sessions`)

      return {
        redisCleanedCount: 0, // Redis cleanup would be handled by RedisService
        databaseCleanedCount: result.count,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error cleaning up expired sessions: ${err.message}`, err.stack)
      throw error
    }
  }

}
