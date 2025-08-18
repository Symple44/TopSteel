import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { AuditEventType, type AuditService, AuditSeverity } from '../../services/audit.service'
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
    private readonly ownershipGuard: ResourceOwnershipGuard,
    private readonly auditService: AuditService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now()
    const request = context.switchToHttp().getRequest()
    const route = request.route?.path || request.url
    const method = request.method
    const resource = this.extractResource(context)
    const action = this.extractAction(context)

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
        await this.auditService.logAccessDenied(
          request.user?.id || 'anonymous',
          resource,
          action,
          'Tenant verification failed',
          {
            route,
            method,
            ipAddress: this.getClientIp(request),
            userAgent: request.headers['user-agent'],
          }
        )
        throw new UnauthorizedException('Échec de la vérification du contexte tenant')
      }

      // 2. Vérification des rôles et permissions (autorisation)
      const rolesResult = await this.rolesGuard.canActivate(context)
      if (!rolesResult) {
        await this.auditService.logAccessDenied(
          request.user?.id,
          resource,
          action,
          'Insufficient permissions',
          {
            route,
            method,
            societeId: request.tenant?.societeId,
            requiredRoles: this.reflector.get<string[]>('roles', context.getHandler()),
            userRole: request.user?.role,
            ipAddress: this.getClientIp(request),
            userAgent: request.headers['user-agent'],
          }
        )
        throw new ForbiddenException('Permissions insuffisantes')
      }

      // 3. Vérification de la propriété des ressources (autorisation fine)
      const ownershipResult = await this.ownershipGuard.canActivate(context)
      if (!ownershipResult) {
        await this.auditService.logAccessDenied(
          request.user?.id,
          resource,
          action,
          'Resource ownership check failed',
          {
            route,
            method,
            societeId: request.tenant?.societeId,
            resourceId: request.params?.id,
            ipAddress: this.getClientIp(request),
            userAgent: request.headers['user-agent'],
          }
        )
        throw new ForbiddenException('Accès refusé à cette ressource')
      }

      // 4. Enregistrer l'accès réussi pour audit
      const duration = Date.now() - startTime
      await this.logSuccessfulAccess(context, resource, action, duration)

      // 5. Détecter les anomalies
      if (request.user?.id) {
        const anomalies = await this.auditService.detectAnomalies(request.user.id, 30)
        if (anomalies.hasAnomalies) {
          await this.auditService.logSuspiciousActivity(
            request.user.id,
            `Anomalies detected: ${anomalies.anomalies.join(', ')}`,
            this.getClientIp(request),
            {
              anomalies: anomalies.anomalies,
              route,
              method,
            }
          )
        }
      }

      return true
    } catch (error) {
      // Auditer toute erreur inattendue
      if (!(error instanceof UnauthorizedException || error instanceof ForbiddenException)) {
        await this.auditService.log({
          eventType: AuditEventType.ACCESS_DENIED,
          severity: AuditSeverity.ERROR,
          userId: request.user?.id,
          resource,
          action,
          success: false,
          errorCode: error.code,
          errorMessage: error.message,
          metadata: {
            route,
            method,
            duration: Date.now() - startTime,
            stack: error.stack,
          },
        })
      }
      throw error
    }
  }

  /**
   * Enregistre l'accès réussi pour l'audit de sécurité
   */
  private async logSuccessfulAccess(
    context: ExecutionContext,
    resource: string,
    action: string,
    duration: number
  ): Promise<void> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    const user = request.user
    const tenant = request.tenant

    // Ne pas auditer les lectures simples sauf si demandé
    const auditReads = this.reflector.get<boolean>('auditReads', context.getHandler())
    if (!auditReads && action === 'read' && request.method === 'GET') {
      return
    }

    await this.auditService.logAccessGranted(user?.id, resource, action, {
      route: request.route?.path || request.url,
      method: request.method,
      societeId: tenant?.societeId,
      siteId: tenant?.siteId,
      statusCode: response.statusCode,
      duration,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      sessionId: request.session?.id,
      requestId: request.id,
      query: request.query,
      params: request.params,
      bodySize: JSON.stringify(request.body || {}).length,
    })
  }

  /**
   * Extrait le nom de la ressource du contexte
   */
  private extractResource(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest()
    const handler = context.getHandler()
    const controller = context.getClass()

    // Essayer d'obtenir depuis les métadonnées
    const resource =
      this.reflector.get<string>('resource', handler) ||
      this.reflector.get<string>('resource', controller)

    if (resource) {
      return resource
    }

    // Extraire depuis l'URL
    const urlParts = request.url.split('/').filter(Boolean)
    if (urlParts.length > 0) {
      // Prendre le premier segment non-vide après 'api'
      const apiIndex = urlParts.indexOf('api')
      if (apiIndex >= 0 && apiIndex < urlParts.length - 1) {
        return urlParts[apiIndex + 1]
      }
      return urlParts[0]
    }

    return 'unknown'
  }

  /**
   * Extrait l'action du contexte
   */
  private extractAction(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest()
    const handler = context.getHandler()

    // Essayer d'obtenir depuis les métadonnées
    const action = this.reflector.get<string>('action', handler)
    if (action) {
      return action
    }

    // Mapper HTTP method vers action CRUD
    const methodToAction: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    }

    return methodToAction[request.method] || 'unknown'
  }

  /**
   * Obtient l'adresse IP du client
   */
  private getClientIp(request: any): string {
    return (
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      'unknown'
    )
  }
}

// Décorateurs utilitaires
export const SkipAuth = () => SetMetadata('skipAuth', true)

export const IsPublic = () => SetMetadata('isPublic', true)

export const AuditReads = () => SetMetadata('auditReads', true)

export const Resource = (resource: string) => SetMetadata('resource', resource)

export const Action = (action: string) => SetMetadata('action', action)
