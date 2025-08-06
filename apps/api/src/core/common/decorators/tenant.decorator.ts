import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common'
import type { DataSource } from 'typeorm'

/**
 * Décorateur pour récupérer le contexte de société depuis la requête
 */
export const TenantContext = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request.tenantContext
})

/**
 * Décorateur pour marquer qu'une route nécessite un contexte société
 */
export const RequiresTenant = () => SetMetadata('requiresTenant', true)

/**
 * Décorateur pour marquer qu'une route accède à la base commune (pas besoin de société)
 */
export const CommonDatabase = () => SetMetadata('commonDatabase', true)

/**
 * Décorateur pour marquer qu'une route peut accéder aux données partagées
 */
export const AllowSharedData = () => SetMetadata('allowSharedData', true)

/**
 * Interface du contexte société injecté dans les requêtes
 */
export interface ITenantContext {
  societeId: string
  societeCode: string
  siteId?: string
  userId: string
  userRole: string
  permissions: string[]
  dataSource?: DataSource // DataSource TypeORM de la société
}
