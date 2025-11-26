import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { TenantContext } from './tenant-context.service'

/**
 * Decorator pour injecter le societeId dans les paramètres du controller
 *
 * Usage:
 *   @Get('articles')
 *   async getArticles(@SocieteId() societeId: string) {
 *     return this.articlesService.findAll(societeId)
 *   }
 */
export const SocieteId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()

    // Le TenantGuard a déjà injecté le contexte dans AsyncLocalStorage
    // On peut aussi l'avoir stocké directement dans la requête
    if (request.tenantContext?.societeId) {
      return request.tenantContext.societeId
    }

    // Fallback: essayer d'extraire depuis le header ou query
    return (
      request.headers['x-tenant-id'] ||
      request.headers['x-societe-id'] ||
      request.query?.societeId ||
      request.user?.societeId ||
      null
    )
  }
)

/**
 * Decorator pour injecter le contexte tenant complet
 *
 * Usage:
 *   @Get('articles')
 *   async getArticles(@TenantCtx() context: TenantContext) {
 *     const { societeId, userId, isSuperAdmin } = context
 *     // ...
 *   }
 */
export const TenantCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext | null => {
    const request = ctx.switchToHttp().getRequest()
    return request.tenantContext || null
  }
)

/**
 * Decorator pour injecter l'userId
 *
 * Usage:
 *   @Get('profile')
 *   async getProfile(@UserId() userId: string) {
 *     return this.usersService.findOne(userId)
 *   }
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest()
    return request.tenantContext?.userId || request.user?.id || null
  }
)

/**
 * Decorator pour vérifier si l'utilisateur est super admin
 *
 * Usage:
 *   @Get('admin/stats')
 *   async getStats(@IsSuperAdmin() isSuperAdmin: boolean) {
 *     if (!isSuperAdmin) {
 *       throw new ForbiddenException()
 *     }
 *     // ...
 *   }
 */
export const IsSuperAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest()
    return request.tenantContext?.isSuperAdmin || false
  }
)
