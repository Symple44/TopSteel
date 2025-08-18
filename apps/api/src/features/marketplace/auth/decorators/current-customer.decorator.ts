import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

export const CurrentMarketplaceCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.customer || request.user
  }
)

export const MarketplaceCustomerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const customer = request.customer || request.user
    return customer?.sub || customer?.id
  }
)

export const MarketplaceTenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  const customer = request.customer || request.user
  return customer?.tenantId || request.headers['x-tenant-id']
})
