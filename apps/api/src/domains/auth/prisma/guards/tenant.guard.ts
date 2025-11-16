import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common'
import { TenantPrismaService } from '../tenant-prisma.service'

/**
 * Guard pour valider le tenant ID et vérifier l'accès
 *
 * Usage:
 *   @UseGuards(TenantGuard)
 *   @Get('users')
 *   async getUsers(@TenantId() tenantId: string) { ... }
 *
 * Validations:
 * - Tenant ID présent dans la requête
 * - Tenant existe et est configuré
 * - Utilisateur a accès au tenant (optionnel)
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name)

  constructor(private readonly tenantService: TenantPrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Extraire le tenant ID (même logique que le decorator)
    const tenantId = this.extractTenantId(request)

    if (!tenantId) {
      this.logger.warn('Tenant ID not found in request')
      throw new ForbiddenException('Tenant ID is required')
    }

    // Vérifier que le tenant est configuré
    const configuredTenants = this.tenantService.getConfiguredTenants()

    if (!configuredTenants.includes(tenantId)) {
      this.logger.warn(`Tenant not configured: ${tenantId}`)
      throw new ForbiddenException(`Tenant not found: ${tenantId}`)
    }

    // Optionnel: Vérifier que l'utilisateur a accès au tenant
    const user = request.user
    if (user && user.tenantId && user.tenantId !== tenantId) {
      this.logger.warn(
        `User ${user.id} attempted to access tenant ${tenantId} but belongs to ${user.tenantId}`
      )
      throw new ForbiddenException('Access denied to this tenant')
    }

    // Stocker le tenant ID dans la requête pour utilisation ultérieure
    request.tenantId = tenantId

    this.logger.debug(`Tenant guard passed for tenant: ${tenantId}`)
    return true
  }

  private extractTenantId(request: any): string | null {
    // 1. Header x-tenant-id
    const headerTenantId = request.headers['x-tenant-id']
    if (headerTenantId) return headerTenantId

    // 2. Query param
    const queryTenantId = request.query?.tenantId
    if (queryTenantId) return queryTenantId

    // 3. JWT user payload
    const user = request.user
    if (user?.tenantId) return user.tenantId

    // 4. Subdomain
    const host = request.headers.host
    if (host) {
      const subdomain = host.split('.')[0]
      if (
        subdomain &&
        !['www', 'api', 'admin', 'localhost'].includes(subdomain) &&
        !subdomain.match(/^\d+\.\d+\.\d+\.\d+$/)
      ) {
        return subdomain
      }
    }

    return null
  }
}
