import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { JwtService } from '@nestjs/jwt'
import { GlobalUserRole } from '../../core/constants/roles.constants'
import type { MultiTenantJwtPayload } from '../../interfaces/jwt-payload.interface'
import type { SessionRedisService } from '../../services/session-redis.service'
import type { UnifiedRolesService } from '../../services/unified-roles.service'

export interface TenantRequirement {
  // Si true, la société doit être spécifiée dans le token
  requireSociete?: boolean
  // Si true, le site doit être spécifié dans le token
  requireSite?: boolean
  // Vérifier que l'utilisateur a accès à la société
  validateSocieteAccess?: boolean
  // Vérifier que la session est active
  validateActiveSession?: boolean
  // Permettre l'accès même sans société pour les SUPER_ADMIN
  allowSuperAdminGlobalAccess?: boolean
}

export interface TenantContext {
  societeId?: string
  societeCode?: string
  siteId?: string
  permissions: string[]
  tenantDatabase?: string
  userSocieteInfo?: unknown
}

export interface UserContext {
  id: string
  email: string
  role: string
  sessionId: string
  globalRole: GlobalUserRole
}

@Injectable()
export class EnhancedTenantGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly sessionRedisService: SessionRedisService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tenantRequirement = this.reflector.getAllAndOverride<TenantRequirement>('tenant', [
      context.getHandler(),
      context.getClass(),
    ])

    // Configuration par défaut
    const requirement: TenantRequirement = {
      requireSociete: false,
      requireSite: false,
      validateSocieteAccess: true,
      validateActiveSession: true,
      allowSuperAdminGlobalAccess: true,
      ...tenantRequirement,
    }

    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException("Token d'authentification manquant")
    }

    try {
      const payload = this.jwtService.verify(token) as MultiTenantJwtPayload

      // Vérifier la session active si requis
      if (requirement.validateActiveSession && payload.sessionId) {
        const sessionData = await this.sessionRedisService.getActiveSession(payload.sessionId)
        if (!sessionData) {
          throw new UnauthorizedException('Session expirée ou inactive')
        }
      }

      // Construire le contexte utilisateur de base
      const userContext: UserContext = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId || '',
        globalRole: payload.role as GlobalUserRole,
      }

      // Construire le contexte tenant
      const tenantContext: TenantContext = {
        societeId: payload.societeId,
        societeCode: payload.societeCode,
        siteId: payload.siteId,
        permissions: payload.permissions || [],
        tenantDatabase: payload.tenantDatabase,
      }

      // Vérifications spécifiques aux exigences
      await this.validateRequirements(requirement, userContext, tenantContext)

      // Enrichir le contexte avec les informations de rôle société
      if (tenantContext.societeId && requirement.validateSocieteAccess) {
        const userSocieteInfo = await this.unifiedRolesService.getUserSocieteRole(
          userContext.id,
          tenantContext.societeId
        )

        if (!userSocieteInfo && userContext.globalRole !== GlobalUserRole.SUPER_ADMIN) {
          throw new ForbiddenException('Accès non autorisé à cette société')
        }

        tenantContext.userSocieteInfo = userSocieteInfo

        // Mettre à jour les permissions avec les permissions effectives
        if (userSocieteInfo) {
          tenantContext.permissions = userSocieteInfo.permissions
        }
      }

      // Ajouter les contextes à la requête
      request.user = userContext
      request.tenant = tenantContext

      // Ajouter des métadonnées utiles
      request.authMeta = {
        tokenType: payload.societeId ? 'multi-tenant' : 'global',
        hasFullSuperAdminAccess: userContext.globalRole === GlobalUserRole.SUPER_ADMIN,
        effectiveRole: (tenantContext.userSocieteInfo as any)?.effectiveRole || userContext.role,
        validatedAt: new Date().toISOString(),
      }

      return true
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error
      }
      throw new UnauthorizedException('Token invalide ou corrompu')
    }
  }

  private async validateRequirements(
    requirement: TenantRequirement,
    userContext: UserContext,
    tenantContext: TenantContext
  ): Promise<void> {
    // Vérifier l'exigence de société
    if (requirement.requireSociete && !tenantContext.societeId) {
      // Exception pour SUPER_ADMIN si autorisé
      if (
        requirement.allowSuperAdminGlobalAccess &&
        userContext.globalRole === GlobalUserRole.SUPER_ADMIN
      ) {
        return
      }
      throw new UnauthorizedException(
        'Contexte société requis. Veuillez vous connecter à une société.'
      )
    }

    // Vérifier l'exigence de site
    if (requirement.requireSite && !tenantContext.siteId) {
      throw new UnauthorizedException('Contexte site requis.')
    }

    // Validation de l'accès à la société
    if (
      requirement.validateSocieteAccess &&
      tenantContext.societeId &&
      userContext.globalRole !== GlobalUserRole.SUPER_ADMIN
    ) {
      const hasAccess = await this.unifiedRolesService.getUserSocieteRole(
        userContext.id,
        tenantContext.societeId
      )

      if (!hasAccess || !hasAccess.isActive) {
        throw new ForbiddenException('Accès révoqué ou expiré pour cette société')
      }
    }
  }

  private extractTokenFromHeader(request: {
    headers: { authorization?: string }
  }): string | undefined {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return undefined
    }

    const [type, token] = authHeader.split(' ')
    return type === 'Bearer' ? token : undefined
  }
}

// Décorateurs pour définir les exigences de tenant
export const RequireTenant = (requirement: TenantRequirement) => SetMetadata('tenant', requirement)

// Décorateurs spécialisés
export const RequireSocieteContext = () =>
  RequireTenant({
    requireSociete: true,
    validateSocieteAccess: true,
  })

export const RequireSiteContext = () =>
  RequireTenant({
    requireSociete: true,
    requireSite: true,
    validateSocieteAccess: true,
  })

export const RequireActiveSession = () =>
  RequireTenant({
    validateActiveSession: true,
  })

export const AllowGlobalSuperAdmin = () =>
  RequireTenant({
    requireSociete: false,
    allowSuperAdminGlobalAccess: true,
  })
