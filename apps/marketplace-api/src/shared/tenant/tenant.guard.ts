import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { TenantResolver } from './tenant-resolver.service'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @Inject(TenantResolver)
    private tenantResolver: TenantResolver
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Résoudre tenant depuis header, domaine ou param
    const tenantId = this.extractTenant(request)

    if (!tenantId) {
      return false
    }

    try {
      const tenantContext = await this.resolveTenant(tenantId)
      request.tenant = tenantContext
      return true
    } catch {
      return false
    }
  }

  private extractTenant(request: unknown): string | null {
    // Type guard to check if request has expected structure
    if (!request || typeof request !== 'object') {
      return null
    }

    const req = request as Record<string, unknown>

    // 1. Header X-Tenant
    if (
      req.headers &&
      typeof req.headers === 'object' &&
      req.headers !== null &&
      !Array.isArray(req.headers)
    ) {
      const headers = req.headers as Record<string, unknown>
      const headerTenant = headers['x-tenant']
      if (typeof headerTenant === 'string') return headerTenant

      // 2. Domaine/Host
      const host = headers.host
      if (typeof host === 'string') return host
    }

    // 3. Paramètre de requête
    if (
      req.query &&
      typeof req.query === 'object' &&
      req.query !== null &&
      !Array.isArray(req.query)
    ) {
      const query = req.query as Record<string, unknown>
      const queryTenant = query.tenant
      if (typeof queryTenant === 'string') return queryTenant
    }

    // 4. Paramètre de route
    if (
      req.params &&
      typeof req.params === 'object' &&
      req.params !== null &&
      !Array.isArray(req.params)
    ) {
      const params = req.params as Record<string, unknown>
      const paramTenant = params.tenant
      if (typeof paramTenant === 'string') return paramTenant
    }

    return null
  }

  private async resolveTenant(identifier: string) {
    // Si c'est un UUID, résoudre par ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (uuidRegex.test(identifier)) {
      return await this.tenantResolver.resolveTenantById(identifier)
    } else {
      return await this.tenantResolver.resolveTenantByDomain(identifier)
    }
  }
}
