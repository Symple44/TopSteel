import { ConfigService } from '@nestjs/config'
import type { TypeOrmModuleOptions } from '@nestjs/typeorm'

/**
 * Multi-Tenant Database Configuration
 * Manages database connections for auth, shared, and tenant-specific databases
 */
export class MultiTenantDatabaseConfig {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get configuration for auth database
   * Contains users, roles, permissions, sessions, etc.
   */
  getAuthDatabaseConfig(): TypeOrmModuleOptions {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development')
    const isDevelopment = nodeEnv === 'development'

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_NAME_AUTH', 'topsteel_auth'),

      // Entity discovery
      entities: [`${__dirname}/../../**/*.entity{.ts,.js}`],

      // Migrations
      migrations: [`${__dirname}/../migrations/auth/*{.ts,.js}`],
      migrationsTableName: 'migrations',

      // Safety settings
      synchronize: isDevelopment && this.configService.get<boolean>('DATABASE_SYNCHRONIZE', false),
      dropSchema: false,

      // Logging
      logging: isDevelopment ? ['query', 'error', 'warn'] : ['error', 'warn'],

      // Connection pool
      extra: {
        max: 20,
        min: 5,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      },

      // Cache
      cache: false,
    }
  }

  /**
   * Get configuration for shared database
   * Contains shared data across all tenants
   */
  getSharedDatabaseConfig(): TypeOrmModuleOptions {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development')
    const isDevelopment = nodeEnv === 'development'

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_NAME_SHARED', 'topsteel_shared'),

      // Entity discovery
      entities: [`${__dirname}/../../**/*.entity{.ts,.js}`],

      // Migrations
      migrations: [`${__dirname}/../migrations/shared/*{.ts,.js}`],
      migrationsTableName: 'migrations',

      // Safety settings
      synchronize: isDevelopment && this.configService.get<boolean>('DATABASE_SYNCHRONIZE', false),
      dropSchema: false,

      // Logging
      logging: isDevelopment ? ['query', 'error', 'warn'] : ['error', 'warn'],

      // Connection pool
      extra: {
        max: 20,
        min: 5,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      },

      // Cache
      cache: false,
    }
  }

  /**
   * Get configuration for tenant-specific database
   * @param tenantCode - Unique identifier for the tenant
   */
  getTenantDatabaseConfig(tenantCode: string): TypeOrmModuleOptions {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development')
    const isDevelopment = nodeEnv === 'development'

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      database: this.configService.get<string>('DB_NAME_TENANT', `topsteel_tenant_${tenantCode}`),

      // Entity discovery
      entities: [`${__dirname}/../../**/*.entity{.ts,.js}`],

      // Migrations
      migrations: [`${__dirname}/../migrations/tenant/*{.ts,.js}`],
      migrationsTableName: 'migrations',

      // Safety settings
      synchronize: isDevelopment && this.configService.get<boolean>('DATABASE_SYNCHRONIZE', false),
      dropSchema: false,

      // Logging
      logging: isDevelopment ? ['query', 'error', 'warn'] : ['error', 'warn'],

      // Connection pool
      extra: {
        max: 20,
        min: 5,
        connectionTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      },

      // Cache
      cache: false,
    }
  }

  /**
   * Get database URL for a specific connection
   */
  getDatabaseUrl(connectionName: 'auth' | 'shared' | 'tenant', tenantCode?: string): string {
    const host = this.configService.get<string>('DB_HOST', 'localhost')
    const port = this.configService.get<number>('DB_PORT', 5432)
    const username = this.configService.get<string>('DB_USERNAME', 'postgres')
    const password = this.configService.get<string>('DB_PASSWORD', 'postgres')

    let database: string
    switch (connectionName) {
      case 'auth':
        database = this.configService.get<string>('DB_NAME_AUTH', 'topsteel_auth')
        break
      case 'shared':
        database = this.configService.get<string>('DB_NAME_SHARED', 'topsteel_shared')
        break
      case 'tenant':
        if (!tenantCode) {
          throw new Error('Tenant code is required for tenant database URL')
        }
        database = this.configService.get<string>('DB_NAME_TENANT', `topsteel_tenant_${tenantCode}`)
        break
      default:
        throw new Error(`Unknown connection name: ${connectionName}`)
    }

    return `postgresql://${username}:${password}@${host}:${port}/${database}`
  }

  /**
   * Get or create a tenant-specific database connection
   * @param tenantCode - Unique identifier for the tenant
   * @returns TypeORM DataSource for the tenant
   */
  async getTenantConnection(tenantCode: string): Promise<any> {
    // This is a placeholder implementation
    // In a real multi-tenant setup, you would:
    // 1. Check if connection exists in a connection pool
    // 2. Create new connection if needed
    // 3. Return the DataSource

    const { DataSource } = require('typeorm')
    const config = this.getTenantDatabaseConfig(tenantCode)

    const dataSource = new DataSource(config)

    if (!dataSource.isInitialized) {
      await dataSource.initialize()
    }

    return dataSource
  }

  /**
   * Close a tenant-specific database connection
   * @param tenantCode - Unique identifier for the tenant
   */
  async closeTenantConnection(tenantCode: string): Promise<void> {
    // This is a placeholder implementation
    // In a real multi-tenant setup, you would:
    // 1. Find the connection in the pool
    // 2. Close it gracefully
    // 3. Remove from pool

    // For now, just log (actual implementation would manage connection pool)
    console.log(`Closing tenant connection for: ${tenantCode}`)
  }
}
