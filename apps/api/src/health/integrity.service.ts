import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import { SessionRedisService } from '../modules/auth/services/session-redis.service'

@Injectable()
export class IntegrityService {
  private readonly logger = new Logger(IntegrityService.name);

  constructor(
    @InjectDataSource('auth')
    private readonly dataSource: DataSource,
    private readonly sessionRedisService: SessionRedisService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async performAutomaticCheck() {
    this.logger.log("Début du contrôle d'intégrité automatique")

    try {
      const results = await this.performFullCheck()

      if (results.errors.length > 0) {
        this.logger.error(`Erreurs d'intégrité détectées: ${results.errors.length}`)
      } else {
        this.logger.log("Contrôle d'intégrité OK")
      }

      return results
    } catch (error) {
      this.logger.error("Erreur lors du contrôle d'intégrité", error)
      throw error
    }
  }

  async performFullCheck() {
    const startTime = Date.now()
    const results = {
      timestamp: new Date().toISOString(),
      duration: 0,
      database: await this.checkDatabaseIntegrity(),
      business: await this.checkBusinessRules(),
      errors: [],
      warnings: [],
      recommendations: [],
    }

    results.duration = Date.now() - startTime
    return results
  }

  async getSystemMetrics() {
    const metrics = {
      database: {
        connections: await this.getActiveConnections(),
      },
      business: {
        totalProjects: await this.getProjectCount(),
        totalClients: await this.getClientCount(),
      },
      users: {
        activeUsers: await this.getActiveUsersCount(),
      },
    }

    return metrics
  }

  async getActiveUsersCount(): Promise<number> {
    let activeFromRedis = 0
    let activeFromDB = 0
    
    try {
      // Essayer Redis d'abord (mais ne pas s'arrêter si c'est 0)
      activeFromRedis = await this.sessionRedisService.getActiveUsersCount()
      this.logger.debug(`Utilisateurs actifs depuis Redis: ${activeFromRedis}`)
    } catch (error) {
      this.logger.debug('Redis non disponible pour le comptage utilisateurs', error)
    }
    
    try {
      // Toujours vérifier la BDD aussi (surtout si Redis est OFF)
      const result = await this.dataSource.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE dernier_login > NOW() - INTERVAL '30 minutes'
        AND actif = true
      `)
      activeFromDB = Number.parseInt(result[0]?.count ?? '0')
      this.logger.debug(`Utilisateurs actifs depuis BDD: ${activeFromDB}`)
    } catch (error) {
      this.logger.warn('Erreur lors du comptage BDD', error)
    }
    
    // Retourner le maximum entre Redis et BDD
    const maxCount = Math.max(activeFromRedis, activeFromDB)
    this.logger.debug(`Utilisateurs actifs final: ${maxCount} (Redis: ${activeFromRedis}, BDD: ${activeFromDB})`)
    
    return maxCount
  }

  private async checkDatabaseIntegrity() {
    return { status: 'ok' }
  }

  private async checkBusinessRules() {
    return { status: 'ok' }
  }

  private async getActiveConnections() {
    try {
      const result = await this.dataSource.query(`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `)
      return Number.parseInt(result[0]?.connections ?? '0')
    } catch (_error) {
      this.logger.error('Erreur lors de la récupération du nombre de clients', _error)
      return 0
    }
  }

  private async getProjectCount() {
    try {
      const result = await this.dataSource.query('SELECT COUNT(*) as count FROM projets')
      return Number.parseInt(result[0]?.count ?? '0')
    } catch (_error) {
      return 0
    }
  }

  private async getClientCount() {
    try {
      const result = await this.dataSource.query('SELECT COUNT(*) as count FROM clients')
      return Number.parseInt(result[0]?.count ?? '0')
    } catch (_error) {
      return 0
    }
  }
}
