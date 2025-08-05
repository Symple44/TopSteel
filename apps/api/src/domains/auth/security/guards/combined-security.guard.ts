import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { EnhancedRolesGuard } from './enhanced-roles.guard'
import type { EnhancedTenantGuard } from './enhanced-tenant.guard'
import type { ResourceOwnershipGuard } from './resource-ownership.guard'

/**
 * Guard combiné qui orchestre tous les contrôles de sécurité
 * dans le bon ordre et avec la logique appropriée
 */
@Injectable()
export class CombinedSecurityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantGuard: EnhancedTenantGuard,
    private readonly rolesGuard: EnhancedRolesGuard,
    private readonly ownershipGuard: ResourceOwnershipGuard
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Vérifier les métadonnées pour voir quels guards sont requis
    const skipAuth = this.reflector.getAllAndOverride<boolean>('skipAuth', [
      context.getHandler(),
      context.getClass(),
    ])

    if (skipAuth) {
      return true
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    try {
      // 1. Vérification et enrichissement du contexte tenant (authentification + tenant)
      const tenantResult = await this.tenantGuard.canActivate(context)
      if (!tenantResult) {
        throw new UnauthorizedException('Échec de la vérification du contexte tenant')
      }

      // 2. Vérification des rôles et permissions (autorisation)
      const rolesResult = await this.rolesGuard.canActivate(context)
      if (!rolesResult) {
        return false
      }

      // 3. Vérification de la propriété des ressources (autorisation fine)
      const ownershipResult = await this.ownershipGuard.canActivate(context)
      if (!ownershipResult) {
        return false
      }

      // 4. Enregistrer l'accès pour audit (optionnel)
      await this.logAccess(context)

      return true
    } catch (error) {
      // Les erreurs spécifiques sont déjà gérées par les guards individuels
      throw error
    }
  }

  /**
   * Enregistre l'accès pour l'audit de sécurité
   */
  private async logAccess(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const tenant = request.tenant

    // Log basique pour l'audit (peut être étendu selon les besoins)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[SECURITY] Accès autorisé - User: ${user?.id}, Société: ${tenant?.societeId}, Route: ${request.route?.path}`
      )
    }

    // TODO: Implémenter un système d'audit plus complet si nécessaire
    // - Enregistrement en base de données
    // - Alertes de sécurité
    // - Métriques de monitoring
  }
}

// Décorateurs utilitaires
export const SkipAuth = () => SetMetadata('skipAuth', true)

export const IsPublic = () => SetMetadata('isPublic', true)
