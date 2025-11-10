import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

export interface DatabaseStats {
  schemaname: string
  tablename: string
  inserts: number
  updates: number
  deletes: number
  live_tuples: number
  dead_tuples: number
  seq_scan: number
  seq_tup_read: number
  idx_scan: number
  idx_tup_fetch: number
  n_tup_ins: number
  n_tup_upd: number
  n_tup_del: number
  vacuum_count: number
  autovacuum_count: number
  analyze_count: number
  autoanalyze_count: number
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    connection: boolean
    migrations: boolean
    queries: boolean
    performance: boolean
  }
  metrics: {
    connectionCount: number
    responseTime: number
    lastMigration?: string
    diskUsage?: number
  }
  warnings: string[]
  errors: string[]
}

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name)

  constructor(@InjectDataSource('auth') private readonly dataSource: DataSource) {}

  /**
   * Vérifie la santé complète de la base de données
   */
  async checkHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now()
    const health: DatabaseHealth = {
      status: 'healthy',
      checks: {
        connection: false,
        migrations: false,
        queries: false,
        performance: false,
      },
      metrics: {
        connectionCount: 0,
        responseTime: 0,
      },
      warnings: [],
      errors: [],
    }

    try {
      // Test de connexion
      health.checks.connection = await this.checkConnection()

      // Test des migrations
      health.checks.migrations = await this.checkMigrations()

      // Test des requêtes
      health.checks.queries = await this.checkQueries()

      // Test de performance
      health.checks.performance = await this.checkPerformance()

      // Métriques
      health.metrics.connectionCount = await this.getConnectionCount()
      health.metrics.responseTime = Date.now() - startTime
      health.metrics.lastMigration = await this.getLastMigration()
      health.metrics.diskUsage = await this.getDiskUsage()

      // Déterminer le statut global
      health.status = this.determineOverallStatus(health)
    } catch (error) {
      health.status = 'unhealthy'
      health.errors.push(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    return health
  }

  /**
   * Vérifie la connexion à la base de données
   */
  private async checkConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1')
      return true
    } catch (error) {
      this.logger.error('Connection check failed:', error)
      return false
    }
  }

  /**
   * Vérifie l'état des migrations
   */
  private async checkMigrations(): Promise<boolean> {
    try {
      const pendingMigrations = await this.dataSource.showMigrations()

      if (Array.isArray(pendingMigrations) && pendingMigrations.length > 0) {
        this.logger.warn(`${pendingMigrations.length} migrations en attente`)
        return false
      }

      return true
    } catch (error) {
      this.logger.error('Migration check failed:', error)
      return false
    }
  }

  /**
   * Vérifie les requêtes basiques
   */
  private async checkQueries(): Promise<boolean> {
    try {
      // Test sur une table critique
      await this.dataSource.query('SELECT COUNT(*) FROM users LIMIT 1')
      return true
    } catch (error) {
      this.logger.error('Query check failed:', error)
      return false
    }
  }

  /**
   * Vérifie les performances
   */
  private async checkPerformance(): Promise<boolean> {
    try {
      const startTime = Date.now()

      // Requête de test de performance
      await this.dataSource.query('SELECT COUNT(*) FROM users')

      const queryTime = Date.now() - startTime

      // Seuil de performance: 1 seconde
      if (queryTime > 1000) {
        this.logger.warn(`Requête lente détectée: ${queryTime}ms`)
        return false
      }

      return true
    } catch (error) {
      this.logger.error('Performance check failed:', error)
      return false
    }
  }

  /**
   * Obtient le nombre de connexions actives
   */
  private async getConnectionCount(): Promise<number> {
    try {
      const result = await this.dataSource.query(`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND state = 'active'
      `)

      return parseInt(result[0]?.count || '0', 10)
    } catch (error) {
      this.logger.error('Failed to get connection count:', error)
      return 0
    }
  }

  /**
   * Obtient la dernière migration exécutée
   */
  private async getLastMigration(): Promise<string | undefined> {
    try {
      const result = await this.dataSource.query(`
        SELECT name 
        FROM migrations 
        ORDER BY timestamp DESC 
        LIMIT 1
      `)

      return result[0]?.name
    } catch (_error) {
      // Table migrations peut ne pas exister
      return undefined
    }
  }

  /**
   * Obtient l'utilisation du disque
   */
  private async getDiskUsage(): Promise<number | undefined> {
    try {
      const result = await this.dataSource.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as bytes
      `)

      return parseInt(result[0]?.bytes || '0', 10)
    } catch (error) {
      this.logger.error('Failed to get disk usage:', error)
      return undefined
    }
  }

  /**
   * Détermine le statut global
   */
  private determineOverallStatus(health: DatabaseHealth): 'healthy' | 'degraded' | 'unhealthy' {
    const { connection, migrations, queries, performance } = health.checks

    // Unhealthy: pas de connexion ou pas de requêtes
    if (!connection || !queries) {
      return 'unhealthy'
    }

    // Degraded: migrations en attente ou performances dégradées
    if (!migrations || !performance) {
      return 'degraded'
    }

    // Healthy: tout va bien
    return 'healthy'
  }

  /**
   * Vérifie rapidement si la base est accessible
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1')
      return true
    } catch (_error) {
      return false
    }
  }

  /**
   * Obtient les métriques de base
   */
  async getBasicMetrics(): Promise<{
    connectionCount: number
    responseTime: number
    isConnected: boolean
  }> {
    const startTime = Date.now()

    try {
      const isConnected = await this.isHealthy()
      const connectionCount = isConnected ? await this.getConnectionCount() : 0

      return {
        connectionCount,
        responseTime: Date.now() - startTime,
        isConnected,
      }
    } catch (_error) {
      return {
        connectionCount: 0,
        responseTime: Date.now() - startTime,
        isConnected: false,
      }
    }
  }

  /**
   * Obtient les statistiques détaillées
   */
  async getDetailedStats(): Promise<DatabaseStats[]> {
    try {
      const stats = await this.dataSource.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `)

      return stats
    } catch (error) {
      this.logger.error('Failed to get detailed stats:', error)
      return []
    }
  }
}
