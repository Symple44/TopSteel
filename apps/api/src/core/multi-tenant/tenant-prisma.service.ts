import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { PrismaService } from '../database/prisma/prisma.service'
import { TenantContextService } from './tenant-context.service'
import { createTenantExtension, TenantPrismaClient } from './prisma-tenant.extension'

/**
 * TenantPrismaService
 *
 * Service qui expose un client Prisma avec filtrage automatique par tenant.
 * Utilise Prisma $extends pour intercepter toutes les requêtes.
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly tenantPrisma: TenantPrismaService) {}
 *
 *   async getMyData() {
 *     // Filtré automatiquement par societeId du contexte
 *     return this.tenantPrisma.client.notification.findMany()
 *   }
 * }
 * ```
 *
 * Pour les opérations sans filtrage (ex: jobs système):
 * ```typescript
 * // Utiliser PrismaService directement
 * constructor(private readonly prisma: PrismaService) {}
 * ```
 */
@Injectable()
export class TenantPrismaService implements OnModuleInit {
  private readonly logger = new Logger(TenantPrismaService.name)
  private _client: TenantPrismaClient | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  onModuleInit() {
    this.logger.log('Initializing Tenant Prisma Client with $extends...')
    this._client = createTenantExtension(this.prisma, this.tenantContext)
    this.logger.log('Tenant Prisma Client initialized')
  }

  /**
   * Client Prisma avec filtrage automatique par tenant
   *
   * Toutes les opérations sur les modèles avec societeId seront
   * automatiquement filtrées par le societeId du contexte courant.
   */
  get client(): TenantPrismaClient {
    if (!this._client) {
      throw new Error('TenantPrismaService not initialized. Ensure onModuleInit has been called.')
    }
    return this._client
  }

  /**
   * Alias pour compatibilité
   */
  get db(): TenantPrismaClient {
    return this.client
  }

  /**
   * Accès au client Prisma brut (sans filtrage)
   * À utiliser avec précaution - uniquement pour les opérations système
   */
  get raw(): PrismaService {
    return this.prisma
  }

  /**
   * Vérifie si le contexte tenant est disponible
   */
  hasTenantContext(): boolean {
    return this.tenantContext.hasTenant()
  }

  /**
   * Obtient le societeId courant (ou null)
   */
  getCurrentSocieteId(): string | null {
    return this.tenantContext.getSocieteIdOrNull()
  }
}
