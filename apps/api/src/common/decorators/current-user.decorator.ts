// apps/api/src/common/decorators/current-user.decorator.ts
import { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'
import type { User } from '../../modules/users/entities/user.entity'

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | User[keyof User] => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user

    return data ? user?.[data] : user
  }
)
