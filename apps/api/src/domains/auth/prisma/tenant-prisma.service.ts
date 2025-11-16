import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

/**
 * TenantPrismaService - POC Phase 1.6
 *
 * Service pour gestion multi-tenant avec Prisma
 *
 * Architecture:
 * - Database-level isolation (1 DB par tenant)
 * - Connection pooling par tenant
 * - Lazy loading des connexions
 * - Cleanup automatique OnModuleDestroy
 *
 * Usage:
 *   const prisma = await tenantService.getTenantClient('tenant-id')
 *   const users = await prisma.user.findMany()
 */
@Injectable()
export class TenantPrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantPrismaService.name)

  // Map tenant ID → PrismaClient instance
  private readonly tenantClients = new Map<string, PrismaClient>()

  // Map tenant ID → DATABASE_URL
  private readonly tenantDatabases = new Map<string, string>()

  constructor(private readonly configService: ConfigService) {
    this.initializeTenantDatabases()
  }

  /**
   * Initialiser les URLs de base de données des tenants
   *
   * En production, ces URLs viendraient d'une DB centrale ou config
   * Pour le POC, on utilise des variables d'environnement
   */
  private initializeTenantDatabases() {
    this.logger.log('Initializing tenant databases configuration')

    // Base URL template pour les tenants
    const baseUrl = this.configService.get<string>('DATABASE_URL')

    if (!baseUrl) {
      this.logger.warn('No DATABASE_URL configured')
      return
    }

    // Pour le POC, on peut avoir TENANT_1_DB_URL, TENANT_2_DB_URL, etc.
    // Ou utiliser un pattern avec base URL
    const tenant1Url = this.configService.get<string>('TENANT_1_DB_URL') || baseUrl
    const tenant2Url = this.configService.get<string>('TENANT_2_DB_URL') || baseUrl

    this.tenantDatabases.set('tenant-1', tenant1Url)
    this.tenantDatabases.set('tenant-2', tenant2Url)

    this.logger.log(`Configured ${this.tenantDatabases.size} tenant databases`)
  }

  /**
   * Obtenir le client Prisma pour un tenant spécifique
   * Lazy loading: crée la connexion si elle n'existe pas
   */
  async getTenantClient(tenantId: string): Promise<PrismaClient> {
    // Vérifier si le client existe déjà
    if (this.tenantClients.has(tenantId)) {
      return this.tenantClients.get(tenantId)!
    }

    // Récupérer l'URL de la base de données du tenant
    const databaseUrl = this.tenantDatabases.get(tenantId)

    if (!databaseUrl) {
      throw new Error(`No database URL configured for tenant: ${tenantId}`)
    }

    this.logger.log(`Creating new Prisma client for tenant: ${tenantId}`)

    // Créer un nouveau client Prisma pour ce tenant
    const client = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: this.configService.get('NODE_ENV') === 'development'
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]
        : [
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ],
    })

    // Log queries en développement
    if (this.configService.get('NODE_ENV') === 'development') {
      // @ts-ignore - Event typing issue with Prisma
      client.$on('query', (e: any) => {
        this.logger.debug(`[${tenantId}] Query: ${e.query}`)
        this.logger.debug(`[${tenantId}] Duration: ${e.duration}ms`)
      })
    }

    // Connecter le client
    await client.$connect()
    this.logger.log(`✅ Prisma client connected for tenant: ${tenantId}`)

    // Stocker le client
    this.tenantClients.set(tenantId, client)

    return client
  }

  /**
   * Déconnecter un tenant spécifique
   */
  async disconnectTenant(tenantId: string): Promise<void> {
    const client = this.tenantClients.get(tenantId)

    if (!client) {
      this.logger.warn(`No client found for tenant: ${tenantId}`)
      return
    }

    this.logger.log(`Disconnecting tenant: ${tenantId}`)
    await client.$disconnect()
    this.tenantClients.delete(tenantId)
    this.logger.log(`✅ Tenant disconnected: ${tenantId}`)
  }

  /**
   * Déconnecter tous les tenants
   */
  async disconnectAll(): Promise<void> {
    this.logger.log(`Disconnecting all tenants (${this.tenantClients.size} clients)`)

    const disconnectPromises = Array.from(this.tenantClients.entries()).map(
      async ([tenantId, client]) => {
        try {
          await client.$disconnect()
          this.logger.log(`✅ Disconnected tenant: ${tenantId}`)
        } catch (error) {
          const err = error as Error
          this.logger.error(
            `Failed to disconnect tenant ${tenantId}: ${err.message}`,
            err.stack
          )
        }
      }
    )

    await Promise.all(disconnectPromises)
    this.tenantClients.clear()
    this.logger.log('✅ All tenants disconnected')
  }

  /**
   * Obtenir la liste des tenants configurés
   */
  getConfiguredTenants(): string[] {
    return Array.from(this.tenantDatabases.keys())
  }

  /**
   * Obtenir la liste des tenants connectés
   */
  getConnectedTenants(): string[] {
    return Array.from(this.tenantClients.keys())
  }

  /**
   * Vérifier si un tenant est connecté
   */
  isConnected(tenantId: string): boolean {
    return this.tenantClients.has(tenantId)
  }

  /**
   * Test de connexion pour un tenant
   */
  async testTenantConnection(tenantId: string): Promise<boolean> {
    try {
      const client = await this.getTenantClient(tenantId)
      await client.$queryRaw`SELECT 1 as result`
      this.logger.log(`✅ Tenant connection test passed: ${tenantId}`)
      return true
    } catch (error) {
      const err = error as Error
      this.logger.error(
        `❌ Tenant connection test failed for ${tenantId}: ${err.message}`,
        err.stack
      )
      return false
    }
  }

  /**
   * Enregistrer un nouveau tenant (pour tests)
   */
  registerTenant(tenantId: string, databaseUrl: string): void {
    this.logger.log(`Registering new tenant: ${tenantId}`)
    this.tenantDatabases.set(tenantId, databaseUrl)
    this.logger.log(`✅ Tenant registered: ${tenantId}`)
  }

  /**
   * Retirer un tenant de la configuration
   */
  async unregisterTenant(tenantId: string): Promise<void> {
    this.logger.log(`Unregistering tenant: ${tenantId}`)

    // Déconnecter si connecté
    if (this.tenantClients.has(tenantId)) {
      await this.disconnectTenant(tenantId)
    }

    // Retirer de la config
    this.tenantDatabases.delete(tenantId)
    this.logger.log(`✅ Tenant unregistered: ${tenantId}`)
  }

  /**
   * Obtenir des statistiques sur les connexions
   */
  getConnectionStats(): {
    configured: number
    connected: number
    tenants: {
      configured: string[]
      connected: string[]
      disconnected: string[]
    }
  } {
    const configured = Array.from(this.tenantDatabases.keys())
    const connected = Array.from(this.tenantClients.keys())
    const disconnected = configured.filter((t) => !connected.includes(t))

    return {
      configured: configured.length,
      connected: connected.length,
      tenants: {
        configured,
        connected,
        disconnected,
      },
    }
  }

  /**
   * Cleanup lors de la destruction du module
   */
  async onModuleDestroy() {
    this.logger.log('🔌 Module destroying, disconnecting all tenants...')
    await this.disconnectAll()
  }

  /**
   * Exécuter une opération isolée pour un tenant
   * Pattern helper pour garantir l'isolation
   */
  async withTenant<T>(
    tenantId: string,
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getTenantClient(tenantId)

    try {
      return await operation(client)
    } catch (error) {
      const err = error as Error
      this.logger.error(
        `Error executing operation for tenant ${tenantId}: ${err.message}`,
        err.stack
      )
      throw error
    }
  }

  /**
   * Exécuter une transaction isolée pour un tenant
   */
  async withTenantTransaction<T>(
    tenantId: string,
    operation: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getTenantClient(tenantId)

    try {
      return await client.$transaction(async (tx) => {
        // @ts-ignore - Transaction proxy type
        return await operation(tx)
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(
        `Transaction error for tenant ${tenantId}: ${err.message}`,
        err.stack
      )
      throw error
    }
  }
}
