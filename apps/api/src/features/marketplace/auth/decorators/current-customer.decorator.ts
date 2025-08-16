import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentMarketplaceCustomer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.customer || request.user;
  },
);

export const MarketplaceCustomerId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const customer = request.customer || request.user;
    return customer?.sub || customer?.id;
  },
);

export const MarketplaceTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const customer = request.customer || request.user;
    return customer?.tenantId || request.headers['x-tenant-id'];
  },
);