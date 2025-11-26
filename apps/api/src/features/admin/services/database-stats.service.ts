import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { getErrorMessage } from '../../../core/common/utils'

interface DatabaseStats {
  totalSize: string
  totalTables: number
  totalRows: number
  activeConnections: number
  cacheHitRate: number
  queryPerformance: {
    avgResponseTime: number
    slowQueries: number
  }
  tablesSizes: Array<{
    tableName: string
    totalSize: string
    rowCount: number
    indexSize: string
  }>
}

@Injectable()
export class DatabaseStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DatabaseStats> {
    try {
      const [
        totalSize,
        totalTables,
        totalRows,
        activeConnections,
        cacheHitRate,
        queryPerformance,
        tablesSizes,
      ] = await Promise.all([
        this.getTotalSize(),
        this.getTotalTables(),
        this.getTotalRows(),
        this.getActiveConnections(),
        this.getCacheHitRate(),
        this.getQueryPerformance(),
        this.getTablesSizes(),
      ])

      return {
        totalSize,
        totalTables,
        totalRows,
        activeConnections,
        cacheHitRate,
        queryPerformance,
        tablesSizes,
      }
    } catch (_error) {
      // Retourner des données par défaut en cas d'erreur
      return {
        totalSize: '0 B',
        totalTables: 0,
        totalRows: 0,
        activeConnections: 0,
        cacheHitRate: 0,
        queryPerformance: {
          avgResponseTime: 0,
          slowQueries: 0,
        },
        tablesSizes: [],
      }
    }
  }

  async optimizeDatabase(): Promise<{
    success: boolean
    message: string
    details?: Record<string, unknown>
  }> {
    try {
      const results: Array<{
        table?: string
        operation?: string
        status: string
        message: string
      }> = []

      // Récupérer toutes les tables
      const tables = await this.prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      `)

      // Optimiser chaque table
      for (const table of tables) {
        try {
          // VACUUM ANALYZE pour optimiser et mettre à jour les statistiques
          await this.prisma.$queryRawUnsafe(`VACUUM ANALYZE ${table.tablename}`)
          results.push({
            table: table.tablename,
            status: 'success',
            message: 'Table optimisée avec succès',
          })
        } catch (error) {
          results.push({
            table: table.tablename,
            status: 'error',
            message: error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue',
          })
        }
      }

      // Réindexer les index
      try {
        await this.prisma.$queryRawUnsafe('REINDEX DATABASE CONCURRENTLY')
        results.push({
          operation: 'reindex',
          status: 'success',
          message: 'Réindexation terminée',
        })
      } catch (error) {
        results.push({
          operation: 'reindex',
          status: 'error',
          message: error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue',
        })
      }

      return {
        success: true,
        message: 'Optimisation terminée',
        details: { operations: results },
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de l'optimisation: ${error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue'}`,
      }
    }
  }

  private async getTotalSize(): Promise<string> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ size: string }>>(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `)
      return result[0]?.size || '0 B'
    } catch (_error) {
      return '0 B'
    }
  }

  private async getTotalTables(): Promise<number> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `)
      return Number(result[0]?.count) || 0
    } catch (_error) {
      return 0
    }
  }

  private async getTotalRows(): Promise<number> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ total_rows: bigint }>>(`
        SELECT SUM(n_tup_ins + n_tup_upd + n_tup_del) as total_rows
        FROM pg_stat_user_tables
      `)
      return Number(result[0]?.total_rows) || 0
    } catch (_error) {
      return 0
    }
  }

  private async getActiveConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
        SELECT COUNT(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
      `)
      return Number(result[0]?.count) || 0
    } catch (_error) {
      return 0
    }
  }

  private async getCacheHitRate(): Promise<number> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ cache_hit_rate: number }>>(`
        SELECT ROUND(
          (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 2
        ) as cache_hit_rate
        FROM pg_statio_user_tables
        WHERE heap_blks_hit + heap_blks_read > 0
      `)
      return result[0]?.cache_hit_rate || 0
    } catch (_error) {
      return 0
    }
  }

  private async getQueryPerformance(): Promise<{ avgResponseTime: number; slowQueries: number }> {
    try {
      const avgResult = await this.prisma.$queryRawUnsafe<Array<{ avg_time: number }>>(`
        SELECT ROUND(AVG(mean_exec_time), 2) as avg_time
        FROM pg_stat_statements
        WHERE calls > 0
      `)

      const slowResult = await this.prisma.$queryRawUnsafe<Array<{ slow_count: bigint }>>(`
        SELECT COUNT(*) as slow_count
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
      `)

      return {
        avgResponseTime: avgResult[0]?.avg_time || 0,
        slowQueries: Number(slowResult[0]?.slow_count) || 0,
      }
    } catch (_error) {
      // pg_stat_statements pourrait ne pas être disponible
      return {
        avgResponseTime: 0,
        slowQueries: 0,
      }
    }
  }

  private async getTablesSizes(): Promise<
    Array<{ tableName: string; totalSize: string; rowCount: number; indexSize: string }>
  > {
    try {
      const result = await this.prisma.$queryRawUnsafe<
        Array<{
          schemaname: string
          table_name: string
          total_size: string
          index_size: string
          row_count: bigint
        }>
      >(`
        SELECT
          schemaname,
          tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
          n_tup_ins + n_tup_upd + n_tup_del as row_count
        FROM pg_tables t
        LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
        WHERE t.schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `)

      return result.map((row) => ({
        tableName: row.table_name,
        totalSize: row.total_size || '0 B',
        rowCount: Number(row.row_count) || 0,
        indexSize: row.index_size || '0 B',
      }))
    } catch (_error) {
      return []
    }
  }
}
