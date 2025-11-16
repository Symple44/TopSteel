import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Decorator pour extraire le tenant ID de la requête
 *
 * Usage dans un controller:
 *   @Get('users')
 *   async getUsers(@TenantId() tenantId: string) {
 *     return this.service.findUsers(tenantId)
 *   }
 *
 * Le tenant ID peut venir de:
 * - Header: x-tenant-id
 * - Query param: tenantId
 * - JWT payload: user.tenantId
 * - Subdomain: tenant.domain.com
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()

    // 1. Vérifier header x-tenant-id
    const headerTenantId = request.headers['x-tenant-id']
    if (headerTenantId) {
      return headerTenantId as string
    }

    // 2. Vérifier query param
    const queryTenantId = request.query?.tenantId
    if (queryTenantId) {
      return queryTenantId as string
    }

    // 3. Vérifier JWT user payload
    const user = request.user
    if (user?.tenantId) {
      return user.tenantId as string
    }

    // 4. Vérifier subdomain (ex: tenant1.topsteel.com)
    const host = request.headers.host
    if (host) {
      const subdomain = host.split('.')[0]
      // Filtrer les subdomains système (www, api, admin, etc.)
      if (
        subdomain &&
        !['www', 'api', 'admin', 'localhost'].includes(subdomain) &&
        !subdomain.match(/^\d+\.\d+\.\d+\.\d+$/) // Not an IP
      ) {
        return subdomain
      }
    }

    // Si aucun tenant trouvé, throw error ou retourner default
    throw new Error('Tenant ID not found in request. Use x-tenant-id header or query param.')
  }
)
