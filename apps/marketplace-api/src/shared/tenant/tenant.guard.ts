import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common'
import type { TenantResolver } from './tenant-resolver.service'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantResolver: TenantResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Résoudre tenant depuis header, domaine ou param
    const tenantId = this.extractTenant(request)

    if (!tenantId) {
      return false
    }

    try {
      const tenantContext = await this.resolveTenant(request, tenantId)
      request.tenant = tenantContext
      return true
    } catch (_error) {
      return false
    }
  }

  private extractTenant(request: any): string | null {
    // 1. Header X-Tenant
    const headerTenant = request.headers['x-tenant']
    if (headerTenant) return headerTenant

    // 2. Domaine/Host
    const host = request.headers.host
    if (host) return host

    // 3. Paramètre de requête
    const queryTenant = request.query.tenant
    if (queryTenant) return queryTenant

    // 4. Paramètre de route
    const paramTenant = request.params.tenant
    if (paramTenant) return paramTenant

    return null
  }

  private async resolveTenant(_request: any, identifier: string) {
    // Si c'est un UUID, résoudre par ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (uuidRegex.test(identifier)) {
      return await this.tenantResolver.resolveTenantById(identifier)
    } else {
      return await this.tenantResolver.resolveTenantByDomain(identifier)
    }
  }
}
