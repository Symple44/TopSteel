import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { QueryBuilderPermissionService } from '../services/query-builder-permission.service'
import type { QueryBuilderSecurityService } from './query-builder-security.service'

/**
 * Security levels for query builder operations
 */
export enum QueryBuilderSecurityLevel {
  /** Read access to whitelisted tables only */
  READ = 'READ',
  /** Full access to query builder features */
  WRITE = 'WRITE',
  /** Admin access including raw SQL (development only) */
  ADMIN = 'ADMIN',
}

/**
 * Decorator to set required security level for query builder operations
 */
export const RequireQueryBuilderAccess = (
  level: QueryBuilderSecurityLevel = QueryBuilderSecurityLevel.READ
) => Reflect.metadata('queryBuilderSecurityLevel', level)

/**
 * Query Builder Security Guard
 *
 * This guard provides comprehensive security controls for query builder operations:
 * - Permission-based access control
 * - Table and column access validation
 * - Security level enforcement
 * - Audit logging of access attempts
 */
@Injectable()
export class QueryBuilderSecurityGuard implements CanActivate {
  private readonly logger = new Logger(QueryBuilderSecurityGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: QueryBuilderPermissionService,
    private readonly securityService: QueryBuilderSecurityService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      this.logger.warn('Query Builder access attempted without authentication')
      throw new ForbiddenException('Authentication required for query builder access')
    }

    // Get required security level from decorator
    const requiredLevel =
      this.reflector.get<QueryBuilderSecurityLevel>(
        'queryBuilderSecurityLevel',
        context.getHandler()
      ) || QueryBuilderSecurityLevel.READ

    // Check user permissions based on security level
    const hasAccess = await this.checkUserAccess(user.id, requiredLevel, request)

    if (!hasAccess) {
      this.logger.warn(
        `Query Builder access denied for user ${user.id} (level: ${requiredLevel})`,
        {
          userId: user.id,
          securityLevel: requiredLevel,
          endpoint: request.url,
          method: request.method,
        }
      )
      throw new ForbiddenException('Insufficient permissions for query builder access')
    }

    // Additional validation based on request content
    await this.validateRequestContent(request, user.id, requiredLevel)

    // Log successful access for audit
    this.logger.log(`Query Builder access granted for user ${user.id} (level: ${requiredLevel})`, {
      userId: user.id,
      securityLevel: requiredLevel,
      endpoint: request.url,
      method: request.method,
    })

    return true
  }

  /**
   * Check if user has required access level
   */
  private async checkUserAccess(
    userId: string,
    requiredLevel: QueryBuilderSecurityLevel,
    request: any
  ): Promise<boolean> {
    switch (requiredLevel) {
      case QueryBuilderSecurityLevel.READ:
        return this.checkReadAccess(userId, request)

      case QueryBuilderSecurityLevel.WRITE:
        return this.checkWriteAccess(userId, request)

      case QueryBuilderSecurityLevel.ADMIN:
        return this.checkAdminAccess(userId, request)

      default:
        return false
    }
  }

  /**
   * Check read access (view existing queries, execute whitelisted queries)
   */
  private async checkReadAccess(userId: string, request: any): Promise<boolean> {
    // Check if user has any query builder permissions
    const hasGeneralAccess = await this.hasQueryBuilderPermission(userId, 'view')

    if (hasGeneralAccess) {
      return true
    }

    // For specific query execution, check query-specific permissions
    const queryBuilderId = this.extractQueryBuilderId(request)
    if (queryBuilderId) {
      return await this.permissionService.checkPermission(queryBuilderId, userId, 'execute')
    }

    // Default: deny access
    return false
  }

  /**
   * Check write access (create, modify queries)
   */
  private async checkWriteAccess(userId: string, request: any): Promise<boolean> {
    // Check if user has edit permissions
    const hasEditAccess = await this.hasQueryBuilderPermission(userId, 'edit')

    if (hasEditAccess) {
      return true
    }

    // For specific query modification, check query-specific permissions
    const queryBuilderId = this.extractQueryBuilderId(request)
    if (queryBuilderId) {
      return await this.permissionService.checkPermission(queryBuilderId, userId, 'edit')
    }

    return false
  }

  /**
   * Check admin access (raw SQL execution, system queries)
   */
  private async checkAdminAccess(userId: string, _request: any): Promise<boolean> {
    // Admin access is highly restricted
    // Check if user has admin role or specific admin permissions

    // For now, only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      this.logger.warn(`Admin query builder access attempted in production by user ${userId}`)
      return false
    }

    // Check if user has admin permissions
    return await this.hasQueryBuilderPermission(userId, 'admin')
  }

  /**
   * Check if user has general query builder permission
   */
  private async hasQueryBuilderPermission(userId: string, _action: string): Promise<boolean> {
    // This would integrate with your existing permission system
    // For now, we'll implement a basic check

    try {
      // Check if user has the required permission in the system
      // This should integrate with your existing permission service

      // Example implementation (adjust based on your permission system):
      // const userPermissions = await this.getUserPermissions(userId)
      // return userPermissions.includes(`query-builder:${action}`)

      // For now, return true for authenticated users in development
      if (process.env.NODE_ENV === 'development') {
        return true
      }

      // In production, implement proper permission checking
      return false
    } catch (error) {
      this.logger.error(`Error checking query builder permissions for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Extract query builder ID from request parameters
   */
  private extractQueryBuilderId(request: unknown): string | null {
    return request.params?.id || request.body?.queryBuilderId || null
  }

  /**
   * Validate request content for additional security checks
   */
  private async validateRequestContent(
    request: unknown,
    userId: string,
    securityLevel: QueryBuilderSecurityLevel
  ): Promise<void> {
    const body = request.body || {}

    // Validate table access if tables are specified
    if (body.fromTable) {
      try {
        this.securityService.validateTable(body.fromTable)
      } catch (_error) {
        this.logger.warn(`Invalid table access attempted by user ${userId}: ${body.fromTable}`)
        throw new ForbiddenException(`Access to table '${body.fromTable}' is not allowed`)
      }
    }

    // Validate column access if columns are specified
    if (body.selectColumns && Array.isArray(body.selectColumns)) {
      for (const column of body.selectColumns) {
        try {
          this.securityService.validateColumn(column.tableName, column.columnName, 'select')
        } catch (_error) {
          this.logger.warn(
            `Invalid column access attempted by user ${userId}: ${column.tableName}.${column.columnName}`
          )
          throw new ForbiddenException(
            `Access to column '${column.columnName}' in table '${column.tableName}' is not allowed`
          )
        }
      }
    }

    // Validate joins if specified
    if (body.joins && Array.isArray(body.joins)) {
      for (const join of body.joins) {
        try {
          this.securityService.validateJoin(join.fromTable, join.toTable)
        } catch (_error) {
          this.logger.warn(
            `Invalid join attempted by user ${userId}: ${join.fromTable} -> ${join.toTable}`
          )
          throw new ForbiddenException(
            `Join from '${join.fromTable}' to '${join.toTable}' is not allowed`
          )
        }
      }
    }

    // For raw SQL (admin level only), validate SQL content
    if (body.sql && securityLevel === QueryBuilderSecurityLevel.ADMIN) {
      try {
        // This validation is performed in the service layer as well,
        // but we do an early check here for security
        const sqlLower = body.sql.toLowerCase().trim()
        if (!sqlLower.startsWith('select')) {
          throw new ForbiddenException('Only SELECT statements are allowed')
        }
      } catch (_error) {
        this.logger.warn(`Invalid raw SQL attempted by user ${userId}`, {
          userId,
          sql: body.sql?.substring(0, 100), // Log first 100 chars for debugging
        })
        throw new ForbiddenException('Invalid SQL query')
      }
    }
  }
}

/**
 * Helper decorator for common query builder access levels
 */
export const QueryBuilderReadAccess = () =>
  RequireQueryBuilderAccess(QueryBuilderSecurityLevel.READ)
export const QueryBuilderWriteAccess = () =>
  RequireQueryBuilderAccess(QueryBuilderSecurityLevel.WRITE)
export const QueryBuilderAdminAccess = () =>
  RequireQueryBuilderAccess(QueryBuilderSecurityLevel.ADMIN)
