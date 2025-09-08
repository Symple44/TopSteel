import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { User } from '../../../users/entities/user.entity'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as User & { roles?: unknown[] }

    if (!user) {
      return false
    }

    // Check if user has roles array (new system) or single role (legacy)
    const userRoles = user.roles || (user.role ? [user.role] : [])

    // Handle null/undefined roles array
    if (!userRoles || userRoles.length === 0) {
      return false
    }

    // Check if user has any of the required roles
    return requiredRoles.some((requiredRole) =>
      userRoles.some((userRole: unknown) => {
        // Handle both string roles and role objects
        const roleObj = userRole as { name?: string; role?: string } | string
        const roleValue = typeof roleObj === 'object' ? roleObj.name || roleObj.role : roleObj
        return roleValue === requiredRole
      })
    )
  }
}
