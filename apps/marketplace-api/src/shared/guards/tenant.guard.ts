import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { TenantResolver } from '../tenant/tenant-resolver.service'

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantResolver: TenantResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    try {
      // Extraire le tenant depuis les headers, params ou domaine
      const tenantCode = this.extractTenantFromRequest(request)

      if (!tenantCode) {
        throw new UnauthorizedException('Tenant non spécifié')
      }

      // Résoudre le contexte tenant
      const tenantContext = await this.tenantResolver.resolveTenantByDomain(tenantCode)

      // Ajouter le contexte à la requête
      request.tenant = tenantContext

      return true
    } catch (error) {
      throw new UnauthorizedException(`Erreur de résolution tenant: ${error.message}`)
    }
  }

  private extractTenantFromRequest(request: unknown): string | null {
    // Type guard to ensure request has the expected structure
    if (!request || typeof request !== 'object') {
      return null
    }

    const req = request as Record<string, unknown>

    // 1. Depuis les headers
    const headers = req.headers as Record<string, unknown> | undefined
    if (headers && typeof headers['x-tenant'] === 'string') {
      return headers['x-tenant']
    }

    // 2. Depuis les paramètres de route
    const params = req.params as Record<string, unknown> | undefined
    if (params && typeof params.tenant === 'string') {
      return params.tenant
    }

    // 3. Depuis le domaine (Host header)
    const host = headers?.host
    if (typeof host === 'string') {
      return this.extractTenantFromHost(host)
    }

    // 4. Depuis les query params
    const query = req.query as Record<string, unknown> | undefined
    if (query && typeof query.tenant === 'string') {
      return query.tenant
    }

    return null
  }

  private extractTenantFromHost(host: string): string {
    // Exemple: topsteel.marketplace.com -> topsteel
    // ou marketplace-topsteel.com -> topsteel

    const parts = host.split('.')

    // Si c'est un sous-domaine
    if (parts.length >= 3 && parts[0] !== 'www') {
      return parts[0]
    }

    // Si c'est dans le nom de domaine principal
    const mainDomain = parts[0]
    if (mainDomain.includes('-')) {
      const domainParts = mainDomain.split('-')
      return domainParts[0]
    }

    // Fallback : utiliser le domaine principal
    return mainDomain
  }
}
