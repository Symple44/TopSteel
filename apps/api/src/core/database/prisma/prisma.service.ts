import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'
// import { ModuleRef } from '@nestjs/core' // Temporarily unused
// import { PrismaTenantMiddleware } from '../../multi-tenant/prisma-tenant.middleware' // Temporarily unused

/**
 * PrismaService - Service global Prisma pour NestJS
 *
 * Features:
 * - Lifecycle hooks (onModuleInit, onModuleDestroy)
 * - Query logging en développement
 * - Connection pooling automatique
 * - Clean database pour tests
 * - Error handling
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL')
    const nodeEnv = process.env.NODE_ENV || 'development'
    const isProd = nodeEnv === 'production'

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: nodeEnv === 'development'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ],
      // Connection pool optimization
      // https://www.prisma.io/docs/concepts/components/prisma-client/connection-pool
      // Default pool size is calculated by: num_physical_cpus * 2 + 1
      // For production, we set explicit values for better control
      ...(isProd && {
        // Production connection pool settings
        // Adjust based on your server capacity and load
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      }),
    })

    // Log queries en développement
    if (nodeEnv === 'development') {
      // @ts-ignore - Event typing issue with Prisma
      this.$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`)
        this.logger.debug(`Params: ${e.params}`)
        this.logger.debug(`Duration: ${e.duration}ms`)
      })
    }

    this.logger.log('PrismaService initialized')
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting to database...')
    try {
      await this.$connect()
      this.logger.log('✅ Database connected successfully')
      this.logger.log('ℹ️  Multi-tenant filtering available via TenantPrismaService')
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error)
      throw error
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting from database...')
    try {
      await this.$disconnect()
      this.logger.log('✅ Database disconnected successfully')
    } catch (error) {
      this.logger.error('❌ Database disconnection failed:', error)
      throw error
    }
  }

  /**
   * Clean database - UNIQUEMENT POUR LES TESTS
   * Supprime toutes les données dans l'ordre correct (respecte les foreign keys)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ Cannot clean database in production environment')
    }

    this.logger.warn('🧹 Cleaning database...')

    try {
      // Désactiver temporairement les foreign key checks
      await this.$executeRawUnsafe('SET session_replication_role = replica;')

      // Ordre important pour respecter les foreign keys
      // Tenant database
      await this.queryBuilderPermission.deleteMany()
      await this.queryBuilderCalculatedField.deleteMany()
      await this.queryBuilderJoin.deleteMany()
      await this.queryBuilderColumn.deleteMany()
      await this.queryBuilder.deleteMany()

      await this.notificationRead.deleteMany()
      await this.notificationRuleExecution.deleteMany()
      await this.notificationRule.deleteMany()
      await this.notificationSettings.deleteMany()
      await this.notificationTemplate.deleteMany()
      await this.notificationEvent.deleteMany()
      await this.notification.deleteMany()

      await this.parameterClient.deleteMany()
      await this.parameterApplication.deleteMany()
      await this.parameterSystem.deleteMany()

      await this.discoveredPage.deleteMany()
      await this.userMenuPreference.deleteMany()
      await this.menuConfigurationSimple.deleteMany()
      await this.userMenuItemPreference.deleteMany()
      await this.userMenuPreferences.deleteMany()
      await this.menuItemPermission.deleteMany()
      await this.menuItemRole.deleteMany()
      await this.menuItem.deleteMany()
      await this.menuConfiguration.deleteMany()

      await this.systemParameter.deleteMany()
      await this.systemSetting.deleteMany()

      // Shared database
      await this.site.deleteMany()
      await this.societeLicense.deleteMany()
      await this.societeUser.deleteMany()

      // Auth database
      await this.smsLog.deleteMany()
      await this.auditLog.deleteMany()
      await this.userSocieteRole.deleteMany()
      await this.userSettings.deleteMany()
      await this.userSession.deleteMany()
      await this.mfaSession.deleteMany()
      await this.userMfa.deleteMany()
      await this.userGroup.deleteMany()
      await this.group.deleteMany()
      await this.userRole.deleteMany()
      await this.rolePermission.deleteMany()
      await this.permission.deleteMany()
      await this.role.deleteMany()
      await this.module.deleteMany()
      await this.user.deleteMany()

      // Shared (après avoir supprimé les dépendances)
      await this.societe.deleteMany()

      // Réactiver les foreign key checks
      await this.$executeRawUnsafe('SET session_replication_role = DEFAULT;')

      this.logger.log('✅ Database cleaned successfully')
    } catch (error) {
      this.logger.error('❌ Error cleaning database:', error)
      // Réactiver les foreign key checks en cas d'erreur
      await this.$executeRawUnsafe('SET session_replication_role = DEFAULT;')
      throw error
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1 as result`
      return true
    } catch (error) {
      this.logger.error('Database connection test failed:', error)
      return false
    }
  }

  /**
   * Get database version
   */
  async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.$queryRaw<{ version: string }[]>`SELECT version()`
      return result[0]?.version || 'Unknown'
    } catch (error) {
      this.logger.error('Failed to get database version:', error)
      return 'Unknown'
    }
  }

  /**
   * Execute raw SQL with logging
   */
  async executeRaw(sql: string, params?: any[]): Promise<any> {
    this.logger.debug(`Executing raw SQL: ${sql}`)
    if (params) {
      this.logger.debug(`With params: ${JSON.stringify(params)}`)
    }
    return this.$executeRawUnsafe(sql, ...(params || []))
  }
}
