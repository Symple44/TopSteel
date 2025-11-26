import { Module, Global } from '@nestjs/common'
import { TenantContextService } from './tenant-context.service'
import { TenantRLSInterceptor } from './tenant-rls.interceptor'
import { TenantGuard } from './tenant.guard'

/**
 * MultiTenantModule
 *
 * Module global pour la gestion multi-tenant.
 *
 * Fournit:
 * - TenantContextService: Gestion du contexte tenant (AsyncLocalStorage)
 * - PrismaTenantMiddleware: Injection automatique societeId dans Prisma
 * - TenantRLSInterceptor: Configuration des variables PostgreSQL RLS
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
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: TenantRLSInterceptor,
 *     },
 *   ]
 */
@Global()
@Module({
  providers: [
    TenantContextService,
    // PrismaTenantMiddleware, // DISABLED: Needs migration to $extends
    TenantRLSInterceptor,
    TenantGuard,
  ],
  exports: [
    TenantContextService,
    // PrismaTenantMiddleware, // DISABLED: Needs migration to $extends
    TenantRLSInterceptor,
    TenantGuard,
  ],
})
export class MultiTenantModule {}
