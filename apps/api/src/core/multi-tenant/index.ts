/**
 * Multi-Tenant Module Exports
 *
 * Architecture unifiée (Single Database + Row-Level Security)
 */

// Module principal
export { MultiTenantModule } from './multi-tenant.module'

// Services
export {
  TenantContextService,
  type TenantContext,
} from './tenant-context.service'

// Middleware & Intercepteurs
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
