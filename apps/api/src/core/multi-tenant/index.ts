/**
 * Multi-Tenant Module Exports
 *
 * Architecture unifiée (Single Database + Prisma $extends)
 */

// Module principal
export { MultiTenantModule } from './multi-tenant.module'

// Services
export {
  TenantContextService,
  type TenantContext,
} from './tenant-context.service'

export { TenantPrismaService } from './tenant-prisma.service'

// Prisma Extension
export {
  createTenantExtension,
  TENANT_MODELS,
  type TenantPrismaClient,
} from './prisma-tenant.extension'

// Intercepteurs (optionnel - pour RLS PostgreSQL)
export { TenantRLSInterceptor } from './tenant-rls.interceptor'

// Guards
export { TenantGuard, Public, AllowMultiTenant } from './tenant.guard'

// Decorators
export {
  SocieteId,
  TenantCtx,
  UserId,
  IsSuperAdmin,
} from './tenant.decorator'
