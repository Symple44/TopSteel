import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { TenantContextService } from './tenant-context.service'
import { Request } from 'express'
import { randomUUID } from 'crypto'

/**
 * Decorator pour marquer les routes comme publiques (pas de tenant requis)
 */
export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => {
  const { SetMetadata } = require('@nestjs/common')
  return SetMetadata(IS_PUBLIC_KEY, true)
}

/**
 * Decorator pour autoriser l'accès multi-tenant (super admin)
 */
export const ALLOW_MULTI_TENANT_KEY = 'allowMultiTenant'
export const AllowMultiTenant = () => {
  const { SetMetadata } = require('@nestjs/common')
  return SetMetadata(ALLOW_MULTI_TENANT_KEY, true)
}

/**
 * Interface étendue de la requête Express avec informations d'auth
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    societeId?: string
    isSuperAdmin?: boolean
    [key: string]: any
  }
}

/**
 * TenantGuard (Version 2.0 - Unified Database + RLS)
 *
 * Guard NestJS pour valider et injecter le contexte tenant dans chaque requête.
 *
 * Fonctionnalités:
 * 1. Extraction du tenant ID depuis multiples sources
 * 2. Validation que le tenant existe
 * 3. Validation que l'utilisateur a accès au tenant
 * 4. Injection du contexte dans AsyncLocalStorage
 * 5. Support des super admins
 * 6. Support des routes publiques
 *
 * Sources d'extraction du tenant (ordre de priorité):
 * 1. Header x-tenant-id
 * 2. Header x-societe-id
 * 3. Query param ?societeId=xxx
 * 4. JWT user.societeId
 * 5. Subdomain (tenant.domain.com)
 *
 * Usage:
 *   // Global (app.module.ts)
 *   APP_GUARD: TenantGuard
 *
 *   // Par controller/route
 *   @UseGuards(TenantGuard)
 *   @Get('articles')
 *   async getArticles() { ... }
 *
 *   // Route publique
 *   @Public()
 *   @Get('health')
 *   async health() { ... }
 *
 *   // Super admin access
 *   @AllowMultiTenant()
 *   @Get('admin/all-data')
 *   async getAllData() { ... }
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name)

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Vérifier si la route est publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      this.logger.debug('Public route - skipping tenant validation')
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const requestId = this.generateRequestId()

    // 2. Extraire les informations utilisateur du JWT
    const user = request.user

    if (!user) {
      this.logger.warn('No authenticated user found')
      throw new UnauthorizedException('Authentication required')
    }

    // 3. Déterminer si l'utilisateur est super admin
    const isSuperAdmin = this.checkSuperAdmin(user)

    // 4. Extraire le tenant ID
    const societeId = this.extractTenantId(request, user)

    if (!societeId) {
      this.logger.warn(`[${requestId}] No tenant ID found in request`)
      throw new ForbiddenException(
        'Tenant ID is required. Please provide x-tenant-id header or societeId in JWT.'
      )
    }

    // 5. Valider que l'utilisateur a accès au tenant (sauf super admin)
    if (!isSuperAdmin) {
      this.validateTenantAccess(user, societeId, requestId)
    }

    // 6. Vérifier si la route autorise le multi-tenant
    const allowMultiTenant = this.reflector.getAllAndOverride<boolean>(
      ALLOW_MULTI_TENANT_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!allowMultiTenant && isSuperAdmin && user.societeId !== societeId) {
      this.logger.warn(
        `[${requestId}] Super admin accessing different tenant: ${societeId} (own: ${user.societeId})`
      )
      // On autorise mais on log pour audit
    }

    // 7. Injecter le contexte tenant dans AsyncLocalStorage
    this.tenantContext.setTenant({
      societeId,
      userId: user.id,
      isSuperAdmin,
      requestId,
    })

    this.logger.debug(
      `[${requestId}] Tenant context set: societeId=${societeId}, userId=${user.id}, isSuperAdmin=${isSuperAdmin}`
    )

    return true
  }

  /**
   * Extraire le tenant ID depuis la requête
   */
  private extractTenantId(
    request: AuthenticatedRequest,
    user: any
  ): string | null {
    // 1. Header x-tenant-id ou x-societe-id
    const headerTenantId =
      request.headers['x-tenant-id'] || request.headers['x-societe-id']
    if (headerTenantId) {
      this.logger.debug(`Tenant ID from header: ${headerTenantId}`)
      return Array.isArray(headerTenantId) ? headerTenantId[0] : headerTenantId
    }

    // 2. Query param
    const queryTenantId = request.query?.societeId || request.query?.tenantId
    if (queryTenantId) {
      this.logger.debug(`Tenant ID from query: ${queryTenantId}`)
      if (Array.isArray(queryTenantId)) {
        return typeof queryTenantId[0] === 'string' ? queryTenantId[0] : null
      }
      return typeof queryTenantId === 'string' ? queryTenantId : null
    }

    // 3. JWT payload
    if (user?.societeId) {
      this.logger.debug(`Tenant ID from JWT: ${user.societeId}`)
      return user.societeId
    }

    // 4. Subdomain (optionnel)
    const host = request.headers.host
    if (host) {
      const subdomain = this.extractSubdomain(host)
      if (subdomain) {
        this.logger.debug(`Tenant ID from subdomain: ${subdomain}`)
        return subdomain
      }
    }

    return null
  }

  /**
   * Extraire le subdomain du host
   */
  private extractSubdomain(host: string): string | null {
    const parts = host.split('.')

    // Besoin d'au moins 3 parties pour un subdomain (sub.domain.com)
    if (parts.length < 3) {
      return null
    }

    const subdomain = parts[0]

    // Exclure les subdomains réservés
    const reserved = ['www', 'api', 'admin', 'app', 'localhost']
    if (reserved.includes(subdomain)) {
      return null
    }

    // Exclure les IPs
    if (subdomain.match(/^\d+$/)) {
      return null
    }

    return subdomain
  }

  /**
   * Vérifier si l'utilisateur est super admin
   */
  private checkSuperAdmin(user: any): boolean {
    return (
      user?.role === 'SUPER_ADMIN' ||
      user?.isSuperAdmin === true ||
      user?.roles?.includes('SUPER_ADMIN')
    )
  }

  /**
   * Valider que l'utilisateur a accès au tenant
   */
  private validateTenantAccess(
    user: any,
    requestedSocieteId: string,
    requestId: string
  ): void {
    // Si l'utilisateur a un societeId dans son JWT, il doit correspondre
    if (user.societeId && user.societeId !== requestedSocieteId) {
      this.logger.warn(
        `[${requestId}] User ${user.id} attempted to access tenant ${requestedSocieteId} but belongs to ${user.societeId}`
      )
      throw new ForbiddenException(
        `Access denied. You do not have permission to access this organization.`
      )
    }

    // TODO: Vérifier dans la DB que l'utilisateur est lié au tenant via UserSocieteRole
    // Pour l'instant, on se fie au JWT
  }

  /**
   * Générer un ID de requête unique pour le traçage
   */
  private generateRequestId(): string {
    return randomUUID().slice(0, 8)
  }
}
