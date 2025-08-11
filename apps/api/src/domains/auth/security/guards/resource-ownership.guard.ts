import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GlobalUserRole, SocieteRoleType } from '../../core/constants/roles.constants'
import { UnifiedRolesService } from '../../services/unified-roles.service'

export interface ResourceOwnershipRequirement {
  // Nom du paramètre contenant l'ID de la ressource
  resourceIdParam?: string
  // Nom du paramètre contenant l'ID du propriétaire
  ownerIdParam?: string
  // Fonction personnalisée pour extraire l'ID du propriétaire
  ownerExtractor?: (request: unknown) => string | Promise<string>
  // Fonction personnalisée pour vérifier la propriété
  ownershipValidator?: (
    userId: string,
    resourceId: string,
    request: unknown
  ) => boolean | Promise<boolean>
  // Rôles qui peuvent bypasser la vérification de propriété
  bypassRoles?: {
    global?: GlobalUserRole[]
    societe?: SocieteRoleType[]
  }
  // Si true, permet l'accès aux gestionnaires d'utilisateurs
  allowUserManagers?: boolean
  // Message d'erreur personnalisé
  errorMessage?: string
}

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly unifiedRolesService: UnifiedRolesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<ResourceOwnershipRequirement>(
      'resourceOwnership',
      [context.getHandler(), context.getClass()]
    )

    if (!requirement) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user
    const tenant = request.tenant

    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié')
    }

    try {
      // Vérifier les rôles de bypass global
      if (requirement.bypassRoles?.global?.includes(user.globalRole)) {
        return true
      }

      // Vérifier les rôles de bypass société
      if (requirement.bypassRoles?.societe && tenant?.userSocieteInfo) {
        const userSocieteRole = tenant.userSocieteInfo.effectiveRole
        if (requirement.bypassRoles.societe.includes(userSocieteRole)) {
          return true
        }
      }

      // Extraire l'ID du propriétaire de la ressource
      const ownerId = await this.extractOwnerId(request, requirement)

      if (!ownerId) {
        throw new BadRequestException('Impossible de déterminer le propriétaire de la ressource')
      }

      // Vérifier si l'utilisateur est le propriétaire
      if (user.id === ownerId) {
        return true
      }

      // Vérifier si l'utilisateur peut gérer d'autres utilisateurs
      if (requirement.allowUserManagers && tenant?.societeId) {
        const canManage = await this.unifiedRolesService.canManageUsersInSociete(
          user.id,
          tenant.societeId
        )

        if (canManage) {
          // Vérifier si le gestionnaire peut gérer cet utilisateur spécifique
          const canManageSpecificUser = await this.unifiedRolesService.canUserManageOtherUser(
            user.id,
            ownerId,
            tenant.societeId
          )

          if (canManageSpecificUser) {
            return true
          }
        }
      }

      // Utiliser le validateur personnalisé si fourni
      if (requirement.ownershipValidator) {
        const resourceId = this.extractResourceId(request, requirement)
        const isValid = await requirement.ownershipValidator(user.id, resourceId, request)
        if (isValid) {
          return true
        }
      }

      // Accès refusé
      throw new ForbiddenException(
        requirement.errorMessage ||
          'Accès refusé. Vous pouvez seulement accéder à vos propres ressources.'
      )
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      throw new ForbiddenException('Erreur lors de la vérification de propriété')
    }
  }

  private async extractOwnerId(
    request: unknown,
    requirement: ResourceOwnershipRequirement
  ): Promise<string | null> {
    // Utiliser l'extracteur personnalisé si fourni
    if (requirement.ownerExtractor) {
      return await requirement.ownerExtractor(request)
    }

    // Utiliser le paramètre spécifié
    if (requirement.ownerIdParam) {
      return ((request as { params?: Record<string, string> }).params[requirement.ownerIdParam] ||
        (request as { body?: Record<string, unknown> }).body[requirement.ownerIdParam] ||
        (request as { query?: Record<string, unknown> }).query[requirement.ownerIdParam] ||
        null) as string
    }

    // Valeurs par défaut à vérifier
    const defaultParams = ['userId', 'ownerId', 'createdBy', 'authorId']

    for (const param of defaultParams) {
      const value =
        (request as { params?: Record<string, string> }).params[param] ||
        (request as { body?: Record<string, unknown> }).body[param] ||
        (request as { query?: Record<string, unknown> }).query[param]
      if (value) {
        return value as string
      }
    }

    return null
  }

  private extractResourceId(request: unknown, requirement: ResourceOwnershipRequirement): string {
    if (requirement.resourceIdParam) {
      return ((request as { params?: Record<string, string> }).params[
        requirement.resourceIdParam
      ] ||
        (request as { body?: Record<string, unknown> }).body[requirement.resourceIdParam] ||
        (request as { query?: Record<string, unknown> }).query[requirement.resourceIdParam] ||
        '') as string
    }

    // Valeurs par défaut pour l'ID de ressource
    const defaultParams = ['id', 'resourceId']

    for (const param of defaultParams) {
      const value =
        (request as { params?: Record<string, string> }).params[param] ||
        (request as { body?: Record<string, unknown> }).body[param] ||
        (request as { query?: Record<string, unknown> }).query[param]
      if (value) {
        return value as string
      }
    }

    return ''
  }
}

// Décorateur pour définir les exigences de propriété
export const RequireResourceOwnership = (requirement: ResourceOwnershipRequirement) =>
  SetMetadata('resourceOwnership', requirement)

// Décorateurs spécialisés
export const RequireOwnerOrManager = (ownerIdParam?: string, errorMessage?: string) =>
  RequireResourceOwnership({
    ownerIdParam,
    allowUserManagers: true,
    bypassRoles: {
      global: [GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN],
    },
    errorMessage,
  })

export const RequireOwnerOnly = (ownerIdParam?: string, errorMessage?: string) =>
  RequireResourceOwnership({
    ownerIdParam,
    allowUserManagers: false,
    bypassRoles: {
      global: [GlobalUserRole.SUPER_ADMIN],
    },
    errorMessage,
  })

export const RequireOwnerOrSocieteAdmin = (ownerIdParam?: string, errorMessage?: string) =>
  RequireResourceOwnership({
    ownerIdParam,
    allowUserManagers: true,
    bypassRoles: {
      global: [GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN],
      societe: [SocieteRoleType.OWNER, SocieteRoleType.ADMIN],
    },
    errorMessage,
  })
