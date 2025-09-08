import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

/**
 * Custom decorator to extract user from request
 * Usage: @GetUser() user: any
 */
export const GetUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request.user
})
