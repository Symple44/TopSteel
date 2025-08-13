import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import {
  GlobalUserRole,
  isGlobalRoleHigherOrEqual,
  isSocieteRoleHigherOrEqual,
  SocieteRoleType,
  SYSTEM_ADMIN_ROLES,
} from '../../core/constants/roles.constants'
import type { UnifiedRolesService } from '../../services/unified-roles.service'

export interface RoleRequirement {
  // Rôles globaux requis
  globalRoles?: GlobalUserRole[]
  // Rôles société requis
  societeRoles?: SocieteRoleType[]
  // Permissions spécifiques requises
  permissions?: string[]
  // Si true, l'utilisateur doit être propriétaire de la ressource
  requireOwnership?: boolean
  // Si true, bypass toutes les vérifications pour SUPER_ADMIN
  allowSuperAdminBypass?: boolean
  // Message d'erreur personnalisé
  errorMessage?: string
}

@Injectable()
export class EnhancedRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly unifiedRolesService: UnifiedRolesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupérer les exigences de rôle depuis les métadonnées
    const roleRequirement = this.reflector.getAllAndOverride<RoleRequirement>('roles', [
      context.getHandler(),
      context.getClass(),
    ])

    // Si aucune exigence, autoriser l'accès
    if (!roleRequirement) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user
    const tenant = request.tenant

    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié')
    }

    try {
      // Get user roles array (new system) or single role (legacy)
      const userRoles = user.roles || (user.role ? [user.role] : [])

      // Vérification SUPER_ADMIN bypass
      if (
        roleRequirement.allowSuperAdminBypass !== false &&
        userRoles.some((role: any) => {
          const roleValue = typeof role === 'object' ? role.name || role.role : role
          return roleValue === GlobalUserRole.SUPER_ADMIN
        })
      ) {
        return true
      }

      // Vérifier les rôles globaux
      if (roleRequirement.globalRoles && roleRequirement.globalRoles.length > 0) {
        const hasGlobalRole = roleRequirement.globalRoles.some((requiredRole) =>
          userRoles.some((userRole: any) => {
            const roleValue =
              typeof userRole === 'object' ? userRole.name || userRole.role : userRole
            return isGlobalRoleHigherOrEqual(roleValue, requiredRole)
          })
        )

        if (!hasGlobalRole) {
          throw new ForbiddenException(
            roleRequirement.errorMessage ||
              `Rôle global requis: ${roleRequirement.globalRoles.join(' ou ')}`
          )
        }
      }

      // Vérifier les rôles société (nécessite un contexte tenant)
      if (roleRequirement.societeRoles && roleRequirement.societeRoles.length > 0) {
        if (!tenant?.societeId) {
          throw new UnauthorizedException('Contexte société requis')
        }

        const userSocieteInfo = await this.unifiedRolesService.getUserSocieteRole(
          user.id,
          tenant.societeId
        )

        if (!userSocieteInfo || !userSocieteInfo.isActive) {
          throw new ForbiddenException('Accès non autorisé à cette société')
        }

        const hasSocieteRole = roleRequirement.societeRoles.some((requiredRole) =>
          isSocieteRoleHigherOrEqual(userSocieteInfo.effectiveRole, requiredRole)
        )

        if (!hasSocieteRole) {
          throw new ForbiddenException(
            roleRequirement.errorMessage ||
              `Rôle société requis: ${roleRequirement.societeRoles.join(' ou ')}`
          )
        }
      }

      // Vérifier les permissions spécifiques
      if (roleRequirement.permissions && roleRequirement.permissions.length > 0) {
        if (!tenant?.permissions) {
          throw new UnauthorizedException('Permissions non disponibles dans le contexte')
        }

        const hasPermission = roleRequirement.permissions.every((permission) =>
          tenant.permissions.includes(permission)
        )

        if (!hasPermission) {
          throw new ForbiddenException(
            roleRequirement.errorMessage ||
              `Permissions requises: ${roleRequirement.permissions.join(', ')}`
          )
        }
      }

      // Vérifier la propriété de la ressource si requis
      if (roleRequirement.requireOwnership) {
        const resourceOwnerId = this.extractResourceOwnerId(request)
        if (resourceOwnerId && resourceOwnerId !== user.id) {
          // Vérifier si l'utilisateur peut gérer d'autres utilisateurs
          const canManage = await this.unifiedRolesService.canManageUsersInSociete(
            user.id,
            tenant?.societeId
          )

          if (!canManage) {
            throw new ForbiddenException(
              roleRequirement.errorMessage || 'Accès limité aux ressources possédées'
            )
          }
        }
      }

      return true
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error
      }
      throw new ForbiddenException('Erreur lors de la vérification des autorisations')
    }
  }

  /**
   * Extrait l'ID du propriétaire de la ressource depuis la requête
   */
  private extractResourceOwnerId(request: {
    params?: { userId?: string; id?: string }
    body?: { userId?: string; ownerId?: string }
    user?: { sub?: string }
  }): string | null {
    // Vérifier les paramètres de route
    if (request.params?.userId) {
      return request.params.userId
    }

    // Vérifier le body de la requête
    if (request.body?.userId) {
      return request.body.userId
    }

    // Vérifier les query parameters
    if ((request as { query?: Record<string, unknown> }).query?.userId) {
      return (request as { query?: Record<string, any> }).query?.userId as string
    }

    return null
  }
}

// Décorateur pour définir les exigences de rôle
export const RequireRoles = (requirement: RoleRequirement) => SetMetadata('roles', requirement)

// Décorateurs spécialisés pour des cas d'usage courants
export const RequireSystemAdmin = (errorMessage?: string) =>
  RequireRoles({
    globalRoles: SYSTEM_ADMIN_ROLES,
    errorMessage: errorMessage || 'Accès administrateur système requis',
  })

export const RequireSocieteAdmin = (errorMessage?: string) =>
  RequireRoles({
    societeRoles: [SocieteRoleType.OWNER, SocieteRoleType.ADMIN],
    errorMessage: errorMessage || 'Accès administrateur société requis',
  })

export const RequireUserManagement = (errorMessage?: string) =>
  RequireRoles({
    societeRoles: [SocieteRoleType.OWNER, SocieteRoleType.ADMIN, SocieteRoleType.MANAGER],
    errorMessage: errorMessage || 'Droits de gestion des utilisateurs requis',
  })

export const RequireOwnership = (errorMessage?: string) =>
  RequireRoles({
    requireOwnership: true,
    errorMessage: errorMessage || 'Accès limité aux ressources possédées',
  })

export const RequirePermissions = (permissions: string[], errorMessage?: string) =>
  RequireRoles({
    permissions,
    errorMessage: errorMessage || `Permissions requises: ${permissions.join(', ')}`,
  })

export const RequireSuperAdminOnly = (errorMessage?: string) =>
  RequireRoles({
    globalRoles: [GlobalUserRole.SUPER_ADMIN],
    allowSuperAdminBypass: false,
    errorMessage: errorMessage || 'Accès réservé aux super administrateurs',
  })
