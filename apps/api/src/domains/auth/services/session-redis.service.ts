import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

interface ActiveSessionData {
  sessionId: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  loginTime: string
  lastActivity: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: {
    browser: string
    os: string
    device: string
    isMobile: boolean
  }
  location?: {
    city: string
    country: string
    countryCode: string
  }
  isIdle: boolean
  warningCount: number
}

@Injectable()
export class SessionRedisService {
  private readonly logger = new Logger(SessionRedisService.name)
  private redis: Redis | null = null
  private readonly sessionPrefix = 'session:'
  private readonly userSessionPrefix = 'user_sessions:'
  private readonly onlineUsersKey = 'online_users'
  private readonly redisEnabled: boolean

  constructor(private configService: ConfigService) {
    this.redisEnabled = this.configService.get<string>('REDIS_ENABLED') === 'true' && this.configService.get<string>('CACHE_ENABLED') !== 'false'

    if (!this.redisEnabled) {
      this.logger.log('Redis is disabled, SessionRedisService will operate in fallback mode')
      return
    }

    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379'

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err) => {
        this.logger.error('Redis reconnect on error:', err.message)
        return true
      },
    })

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis')
    })

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error:', err)
    })
  }

  async isConnected(): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) {
      return false
    }

    try {
      await this.redis.ping()
      return true
    } catch (error) {
      this.logger.error('Redis ping failed:', error)
      return false
    }
  }

  /**
   * Ajouter une session active
   */
  async addActiveSession(
    sessionData: ActiveSessionData,
    ttlSeconds: number = 24 * 60 * 60
  ): Promise<void> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, skipping session storage')
      return
    }

    try {
      const key = `${this.sessionPrefix}${sessionData.sessionId}`

      // Stocker les données de session
      await this.redis.setex(key, ttlSeconds, JSON.stringify(sessionData))

      // Ajouter à l'index des utilisateurs en ligne
      await this.redis.sadd(this.onlineUsersKey, sessionData.userId)

      // Maintenir un index des sessions par utilisateur
      const userSessionsKey = `${this.userSessionPrefix}${sessionData.userId}`
      await this.redis.sadd(userSessionsKey, sessionData.sessionId)
      await this.redis.expire(userSessionsKey, ttlSeconds)

      this.logger.log(
        `Session active ajoutée: ${sessionData.sessionId} pour user ${sessionData.userId}`
      )
    } catch (error) {
      this.logger.error("Erreur lors de l'ajout de session active:", error)
      throw error
    }
  }

  /**
   * Mettre à jour l'activité d'une session
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, skipping session activity update')
      return
    }

    try {
      const key = `${this.sessionPrefix}${sessionId}`
      const sessionData = await this.getActiveSession(sessionId)

      if (sessionData) {
        sessionData.lastActivity = new Date().toISOString()
        sessionData.isIdle = false

        const ttl = await this.redis.ttl(key)
        await this.redis.setex(key, ttl > 0 ? ttl : 24 * 60 * 60, JSON.stringify(sessionData))
      }
    } catch (error) {
      this.logger.error("Erreur lors de la mise à jour d'activité:", error)
    }
  }

  /**
   * Récupérer une session active
   */
  async getActiveSession(sessionId: string): Promise<ActiveSessionData | null> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, returning default value for getActiveSession')
      return null
    }

    try {
      const key = `${this.sessionPrefix}${sessionId}`
      const data = await this.redis.get(key)

      if (data) {
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de session:', error)
      return null
    }
  }

  /**
   * Récupérer toutes les sessions actives
   */
  async getAllActiveSessions(): Promise<ActiveSessionData[]> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, returning default value for getAllActiveSessions')
      return []
    }

    try {
      const keys = await this.redis.keys(`${this.sessionPrefix}*`)
      const sessions: ActiveSessionData[] = []

      if (keys.length > 0) {
        const values = await this.redis.mget(...keys)

        for (const value of values) {
          if (value) {
            try {
              const sessionData = JSON.parse(value)
              // Vérifier si la session doit être marquée comme inactive
              const lastActivity = new Date(sessionData.lastActivity)
              const now = new Date()
              const inactiveThreshold = 15 * 60 * 1000 // 15 minutes

              if (now.getTime() - lastActivity.getTime() > inactiveThreshold) {
                sessionData.isIdle = true
              }

              sessions.push(sessionData)
            } catch (parseError) {
              this.logger.error('Erreur parsing session data:', parseError)
            }
          }
        }
      }

      return sessions.sort(
        (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
      )
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des sessions actives:', error)
      return []
    }
  }

  /**
   * Supprimer une session active
   */
  async removeActiveSession(sessionId: string): Promise<boolean> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, returning default value for removeActiveSession')
      return false
    }

    try {
      const sessionData = await this.getActiveSession(sessionId)
      if (!sessionData) {
        return false
      }

      const key = `${this.sessionPrefix}${sessionId}`

      // Supprimer la session
      await this.redis.del(key)

      // Supprimer de l'index des sessions utilisateur
      const userSessionsKey = `${this.userSessionPrefix}${sessionData.userId}`
      await this.redis.srem(userSessionsKey, sessionId)

      // Vérifier si l'utilisateur a encore des sessions actives
      const remainingSessions = await this.redis.scard(userSessionsKey)
      if (remainingSessions === 0) {
        await this.redis.srem(this.onlineUsersKey, sessionData.userId)
        await this.redis.del(userSessionsKey)
      }

      this.logger.log(`Session supprimée: ${sessionId}`)
      return true
    } catch (error) {
      this.logger.error('Erreur lors de la suppression de session:', error)
      return false
    }
  }

  /**
   * Forcer la déconnexion d'un utilisateur (toutes ses sessions)
   */
  async forceLogoutUser(userId: string): Promise<string[]> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, returning default value for forceLogoutUser')
      return []
    }

    try {
      const userSessionsKey = `${this.userSessionPrefix}${userId}`
      const sessionIds = await this.redis.smembers(userSessionsKey)

      const removedSessions: string[] = []

      for (const sessionId of sessionIds) {
        const success = await this.removeActiveSession(sessionId)
        if (success) {
          removedSessions.push(sessionId)
        }
      }

      this.logger.log(
        `Utilisateur ${userId} forcé à se déconnecter, ${removedSessions.length} sessions supprimées`
      )
      return removedSessions
    } catch (error) {
      this.logger.error('Erreur lors de la déconnexion forcée:', error)
      return []
    }
  }

  /**
   * Forcer la déconnexion d'une session spécifique
   */
  async forceLogoutSession(sessionId: string): Promise<boolean> {
    return await this.removeActiveSession(sessionId)
  }

  /**
   * Récupérer les sessions d'un utilisateur
   */
  async getUserActiveSessions(userId: string): Promise<ActiveSessionData[]> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, returning default value for getUserActiveSessions')
      return []
    }

    try {
      const userSessionsKey = `${this.userSessionPrefix}${userId}`
      const sessionIds = await this.redis.smembers(userSessionsKey)

      const sessions: ActiveSessionData[] = []

      for (const sessionId of sessionIds) {
        const sessionData = await this.getActiveSession(sessionId)
        if (sessionData) {
          sessions.push(sessionData)
        }
      }

      return sessions.sort(
        (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
      )
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des sessions utilisateur:', error)
      return []
    }
  }

  /**
   * Nettoyer les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, returning default value for cleanupExpiredSessions')
      return 0
    }

    try {
      const allSessions = await this.getAllActiveSessions()
      let cleanedCount = 0

      const expiredThreshold = 24 * 60 * 60 * 1000 // 24 heures
      const now = new Date()

      for (const session of allSessions) {
        const loginTime = new Date(session.loginTime)
        if (now.getTime() - loginTime.getTime() > expiredThreshold) {
          await this.removeActiveSession(session.sessionId)
          cleanedCount++
        }
      }

      this.logger.log(`Nettoyage terminé: ${cleanedCount} sessions expirées supprimées`)
      return cleanedCount
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des sessions:', error)
      return 0
    }
  }

  /**
   * Obtenir les statistiques des sessions
   */
  async getSessionStats(): Promise<{
    totalOnline: number
    totalActive: number
    totalIdle: number
    warningCount: number
  }> {
    try {
      const allSessions = await this.getAllActiveSessions()

      return {
        totalOnline: allSessions.length,
        totalActive: allSessions.filter((s) => !s.isIdle).length,
        totalIdle: allSessions.filter((s) => s.isIdle).length,
        warningCount: allSessions.reduce((sum, s) => sum + s.warningCount, 0),
      }
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des stats:', error)
      return {
        totalOnline: 0,
        totalActive: 0,
        totalIdle: 0,
        warningCount: 0,
      }
    }
  }

  /**
   * Compter le nombre d'utilisateurs uniques actifs
   */
  async getActiveUsersCount(): Promise<number> {
    if (!this.redisEnabled || !this.redis) {
      this.logger.debug('Redis disabled, returning 0 for getActiveUsersCount')
      return 0
    }

    try {
      const pattern = `${this.sessionPrefix}*`
      const keys = await this.redis.keys(pattern)

      if (keys.length === 0) {
        return 0
      }

      // Récupérer tous les userId uniques des sessions actives
      const userIds = new Set<string>()

      for (const key of keys) {
        const sessionData = await this.redis.get(key)
        if (sessionData) {
          const session: ActiveSessionData = JSON.parse(sessionData)
          userIds.add(session.userId)
        }
      }

      return userIds.size
    } catch (error) {
      this.logger.error('Erreur lors du comptage des utilisateurs actifs:', error)
      return 0
    }
  }

  /**
   * Fermer la connexion Redis
   */
  async disconnect(): Promise<void> {
    if (!this.redisEnabled || !this.redis) {
      return
    }
    await this.redis.disconnect()
  }
}
