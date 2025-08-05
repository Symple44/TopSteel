import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { TenantResolver } from './tenant-resolver.service'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private tenantResolver: TenantResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    console.log(`TenantGuard: Traitement de la requête vers ${request.url}`)
    console.log(`TenantGuard: Headers disponibles:`, {
      host: request.headers.host,
      'x-tenant': request.headers['x-tenant'],
      'user-agent': request.headers['user-agent']?.substring(0, 50),
    })

    // Résoudre tenant depuis header, domaine ou param
    const tenantId = this.extractTenant(request)

    if (!tenantId) {
      console.error('TenantGuard: Aucun tenant trouvé dans la requête')
      console.error('TenantGuard: Headers disponibles:', request.headers)
      return false
    }

    console.log(`TenantGuard: Résolution du tenant "${tenantId}"`)

    try {
      const tenantContext = await this.resolveTenant(request, tenantId)
      request.tenant = tenantContext
      console.log(`TenantGuard: Tenant "${tenantId}" résolu avec succès`, {
        societeId: tenantContext.societeId,
        hasConnection: !!tenantContext.erpTenantConnection,
        marketplaceEnabled: tenantContext.marketplaceEnabled,
      })
      return true
    } catch (error) {
      console.error(
        `TenantGuard: Erreur lors de la résolution du tenant "${tenantId}":`,
        error.message
      )
      console.error(`TenantGuard: Stack trace:`, error.stack)
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

  private async resolveTenant(request: any, identifier: string) {
    // Si c'est un UUID, résoudre par ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (uuidRegex.test(identifier)) {
      return await this.tenantResolver.resolveTenantById(identifier)
    } else {
      return await this.tenantResolver.resolveTenantByDomain(identifier)
    }
  }
}
