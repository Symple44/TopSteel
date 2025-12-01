import { Module, Global } from '@nestjs/common'
import { TenantContextService } from './tenant-context.service'
import { TenantRLSInterceptor } from './tenant-rls.interceptor'
import { TenantGuard } from './tenant.guard'
import { TenantPrismaService } from './tenant-prisma.service'

/**
 * MultiTenantModule
 *
 * Module global pour la gestion multi-tenant.
 *
 * Fournit:
 * - TenantContextService: Gestion du contexte tenant (AsyncLocalStorage)
 * - TenantPrismaService: Client Prisma avec filtrage automatique par societeId
 * - TenantRLSInterceptor: Configuration des variables PostgreSQL RLS (optionnel)
 * - TenantGuard: Validation et injection du contexte tenant
 *
 * Usage:
 *   // app.module.ts
 *   @Module({
 *     imports: [MultiTenantModule],
 *   })
 *
 *   // Puis configurer les providers globaux:
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: TenantGuard,
 *     },
 *   ]
 *
 *   // Dans vos services, utiliser TenantPrismaService:
 *   constructor(private readonly tenantPrisma: TenantPrismaService) {}
 *
 *   async getData() {
 *     return this.tenantPrisma.client.notification.findMany() // Filtré automatiquement
 *   }
 */
@Global()
@Module({
  providers: [
    TenantContextService,
    TenantPrismaService,
    TenantRLSInterceptor,
    TenantGuard,
  ],
  exports: [
    TenantContextService,
    TenantPrismaService,
    TenantRLSInterceptor,
    TenantGuard,
  ],
})
export class MultiTenantModule {}
