import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

export interface TenantInfo {
  societeId: string
  societeCode: string
  siteId?: string
  permissions: string[]
  tenantDatabase: string
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantInfo => {
    const request = ctx.switchToHttp().getRequest()
    return request.tenant
  }
)
