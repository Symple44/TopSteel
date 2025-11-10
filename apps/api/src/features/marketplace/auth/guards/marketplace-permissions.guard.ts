import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  MARKETPLACE_PERMISSIONS_KEY,
  MarketplacePermission,
} from '../decorators/marketplace-permissions.decorator'

@Injectable()
export class MarketplacePermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<MarketplacePermission[]>(
      MARKETPLACE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException('User not authenticated')
    }

    // Check if user has super admin permission
    if (this.hasPermission(user, MarketplacePermission.SUPER_ADMIN)) {
      return true
    }

    // Check if user has any of the required permissions
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      this.hasPermission(user, permission)
    )

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
      )
    }

    return true
  }

  private hasPermission(
    user: { roles?: string[]; role?: string; permissions?: string[] },
    permission: MarketplacePermission
  ): boolean {
    // Check user roles for permission
    const userRoles = user.roles || (user.role ? [user.role] : [])

    // Admin and super admin have all permissions
    if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
      return true
    }

    // Check specific marketplace permissions
    const userPermissions = user.permissions || []
    return userPermissions.includes(permission)
  }
}
