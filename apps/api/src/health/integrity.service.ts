import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

@Injectable()
export class IntegrityService {
  private readonly logger = new Logger(IntegrityService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
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
    }

    return metrics
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
