import { Injectable } from '@nestjs/common'
import type { User, Permission, Role, RolePermission, UserSocieteRole } from '@prisma/client'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import type {
  PermissionData,
  UserSocieteRole as UserSocieteRoleType,
} from '../../../types/entities/user.types'
import type { IRolePermission } from '../types/entities.types'


/**
 * Permission query operators
 */
export enum PermissionOperator {
  HAS = 'HAS',
  HAS_ALL = 'HAS_ALL',
  HAS_ANY = 'HAS_ANY',
  HAS_NONE = 'HAS_NONE',
  MATCHES = 'MATCHES',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  CONTAINS = 'CONTAINS',
}

/**
 * Permission scope
 */
export enum PermissionScope {
  GLOBAL = 'GLOBAL',
  SOCIETE = 'SOCIETE',
  SITE = 'SITE',
  RESOURCE = 'RESOURCE',
}

/**
 * Permission query condition
 */
export interface PermissionCondition {
  operator: PermissionOperator
  permissions?: string[]
  pattern?: string
  scope?: PermissionScope
  societeId?: string
  siteId?: string
  resourceType?: string
  resourceId?: string
  includeInherited?: boolean
  excludeRestricted?: boolean
}

/**
 * Permission query options
 */
export interface PermissionQueryOptions {
  conditions: PermissionCondition[]
  logic?: 'AND' | 'OR'
  includeRoles?: boolean
  includeUsers?: boolean
  includeGroups?: boolean
  includeSocietes?: boolean
  sortBy?: 'permission' | 'user' | 'role' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
  limit?: number
  offset?: number
  cache?: boolean
  cacheKey?: string
  cacheTTL?: number
}

/**
 * Permission query result
 */
export interface PermissionQueryResult {
  permissions: Array<{
    code: string
    name: string
    description?: string
    category?: string
    scope: PermissionScope

    users?: Array<{ id: string; email: string; name: string }>
    roles?: Array<{ id: string; code: string; name: string }>
    societes?: Array<{ id: string; name: string }>
  }>
  total: number
  metadata: {
    executionTime: number
    cached: boolean
    conditions: number
  }
}

/**
 * User permission query result
 */
export interface UserPermissionQueryResult {
  users: Array<{
    id: string
    email: string
    name: string
    permissions: string[]
    roles: Array<{ code: string; name: string }>
    societes: Array<{ id: string; name: string }>
    matchedConditions: number
  }>
  total: number
  metadata: {
    executionTime: number
    cached: boolean
  }
}

/**
 * Permission conflict
 */
export interface PermissionConflict {
  permission: string
  sources: Array<{
    type: 'role' | 'additional' | 'restricted'
    source: string
    action: 'grant' | 'deny'
    priority: number
  }>
  resolution: 'granted' | 'denied'
  reason: string
}

/**
 * Permission query builder service
 */
@Injectable()
export class PermissionQueryBuilderService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly cacheService: OptimizedCacheService
  ) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Build and execute a permission query
   */
  async queryPermissions(options: PermissionQueryOptions): Promise<PermissionQueryResult> {
    const startTime = Date.now()

    // Check cache if enabled
    if (options.cache && options.cacheKey) {
      const cached = await this.cacheService.get<PermissionQueryResult>(options.cacheKey)
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cached: true,
          },
        }
      }
    }

    // Build Prisma query
    const where = this.buildPermissionWhere(options)
    const orderBy = this.buildOrderBy(options)

    // Execute query with Prisma
    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        orderBy,
        skip: options.offset,
        take: options.limit,
        include: options.includeRoles
          ? ({
              permissions: {
                include: {
                  role: true,
                },
              },
            } as any)
          : undefined,
      }),
      this.prisma.permission.count({ where }),
    ])

    // Format results
    const result: PermissionQueryResult = {
      permissions: await this.formatPermissionResults(permissions, options),
      total,
      metadata: {
        executionTime: Date.now() - startTime,
        cached: false,
        conditions: options.conditions.length,
      },
    }

    // Cache if enabled
    if (options.cache && options.cacheKey) {
      await this.cacheService.set(options.cacheKey, result, options.cacheTTL || 300)
    }

    return result
  }

  /**
   * Query users by permissions
   */
  async queryUsersByPermissions(
    conditions: PermissionCondition[],
    options?: Partial<PermissionQueryOptions>
  ): Promise<UserPermissionQueryResult> {
    const startTime = Date.now()

    // Build where clause for users
    const where = this.buildUserPermissionWhere(conditions, options?.logic || 'AND')

    // Build orderBy
    const orderBy: any = {}
    if (options?.sortBy === 'user') {
      orderBy.email = options.sortOrder?.toLowerCase() || 'asc'
    } else if (options?.sortBy === 'createdAt') {
      orderBy.createdAt = options.sortOrder?.toLowerCase() || 'asc'
    }

    // Execute query with Prisma
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: options?.offset,
        take: options?.limit,
        include: {
          societeRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    // Format results
    const result: UserPermissionQueryResult = {
      users: await this.formatUserResults(users, conditions),
      total,
      metadata: {
        executionTime: Date.now() - startTime,
        cached: false,
      },
    }

    return result
  }

  /**
   * Find users with specific permission
   */
  async findUsersWithPermission(
    permission: string,
    societeId?: string,
    siteId?: string
  ): Promise<User[]> {
    // Split permission into resource and action
    const [resource, action] = permission.split(':')

    // Build where clause
    const where: any = {
      userSocieteRoles: {
        some: {
          role: {
            rolePermissions: {
              some: {
                permission: {
                  resource,
                  action,
                },
              },
            },
          },
        },
      },
    }

    // Add societeId filter if provided
    if (societeId) {
      where.userSocieteRoles.some.societeId = societeId
    }

    // Add siteId filter if provided
    if (siteId) {
      where.userSocieteRoles.some.allowedSiteIds = {
        has: siteId,
      }
    }

    return await this.prisma.user.findMany({
      where,
      include: {
        societeRoles: {
          include: {
            role: true,
          },
        },
      },
    })
  }

  /**
   * Find permissions by pattern
   */
  async findPermissionsByPattern(
    pattern: string,
    operator: PermissionOperator = PermissionOperator.MATCHES
  ): Promise<Permission[]> {
    // Use raw SQL for complex pattern matching
    let sql = ''
    const params: any[] = []

    switch (operator) {
      case PermissionOperator.STARTS_WITH:
        return await this.prisma.permission.findMany({
          where: {
            OR: [
              { resource: { startsWith: pattern } },
              { action: { startsWith: pattern } },
            ],
          },
        })
      case PermissionOperator.ENDS_WITH:
        return await this.prisma.permission.findMany({
          where: {
            OR: [
              { resource: { endsWith: pattern } },
              { action: { endsWith: pattern } },
            ],
          },
        })
      case PermissionOperator.CONTAINS:
        return await this.prisma.permission.findMany({
          where: {
            OR: [
              { resource: { contains: pattern } },
              { action: { contains: pattern } },
            ],
          },
        })
      default:
        // For regex matching, use raw SQL
        sql = `SELECT * FROM "Permission" WHERE (resource || ':' || action) ~ $1`
        params.push(pattern)
        return await this.prisma.$queryRawUnsafe<Permission[]>(sql, ...params)
    }
  }

  /**
   * Analyze permission conflicts for a user
   */
  async analyzePermissionConflicts(
    userId: string,
    societeId: string
  ): Promise<PermissionConflict[]> {
    // Get user's roles and permissions
    const userRoles = await this.prisma.userSocieteRole.findMany({
      where: { userId, societeId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      },
    })

    const conflicts: PermissionConflict[] = []
    const permissionMap = new Map<string, PermissionConflict>()

    // Analyze each role
    for (const userRole of userRoles) {
      // Role permissions - vérifier que le rôle existe et a des permissions
      const role = userRole.role
      if (!role) continue

      for (const rolePerm of role.permissions || []) {
        const rp = rolePerm as any
        const permission = rp.permission as any
        const permCode = `${permission.resource}:${permission.action}`
        let conflict = permissionMap.get(permCode)

        if (!conflict) {
          conflict = {
            permission: permCode,
            sources: [],
            resolution: 'granted',
            reason: '',
          }
          permissionMap.set(permCode, conflict)
        }

        conflict.sources.push({
          type: 'role',
          source: role.name,
          action: 'grant',
          priority: 1,
        })
      }

      // Additional permissions from JSON
      const permissionsData = (userRole.permissions as any) || {}
      const additionalPermissions = permissionsData.additionalPermissions || []
      for (const addPerm of additionalPermissions) {
        let conflict = permissionMap.get(addPerm)

        if (!conflict) {
          conflict = {
            permission: addPerm,
            sources: [],
            resolution: 'granted',
            reason: '',
          }
          permissionMap.set(addPerm, conflict)
        }

        conflict.sources.push({
          type: 'additional',
          source: 'Direct grant',
          action: 'grant',
          priority: 2,
        })
      }

      // Restricted permissions from JSON
      const restrictedPermissions = permissionsData.restrictedPermissions || []
      for (const resPerm of restrictedPermissions) {
        let conflict = permissionMap.get(resPerm)

        if (conflict) {
          conflict.sources.push({
            type: 'restricted',
            source: 'Direct restriction',
            action: 'deny',
            priority: 3,
          })
          conflict.resolution = 'denied'
          conflict.reason = 'Restriction overrides grants'
        } else {
          conflict = {
            permission: resPerm,
            sources: [],
            resolution: 'denied',
            reason: 'Explicitly restricted',
          }
          permissionMap.set(resPerm, conflict)
        }
      }
    }

    // Identify actual conflicts (multiple sources)
    for (const conflict of permissionMap.values()) {
      if (conflict.sources.length > 1) {
        // Check if there are both grant and deny actions
        const hasGrant = conflict.sources.some((s) => s.action === 'grant')
        const hasDeny = conflict.sources.some((s) => s.action === 'deny')

        if (hasGrant && hasDeny) {
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }

  /**
   * Get permission hierarchy
   */
  async getPermissionHierarchy(rootPermission?: string): Promise<
    Array<{
      permission: string
      level: number
      children: string[]
      parent?: string
    }>
  > {
    const permissions = await this.prisma.permission.findMany()
    const hierarchy: Array<{
      permission: string
      level: number
      children: string[]
      parent?: string
    }> = []

    // Build hierarchy based on permission naming convention (e.g., module:resource:action)
    const permissionTree = new Map<string, Set<string>>()

    for (const perm of permissions) {
      const permCode = `${perm.resource}:${perm.action}`
      const parts = permCode.split(':')
      let current = ''

      for (let i = 0; i < parts.length; i++) {
        const parent = current
        current = parts.slice(0, i + 1).join(':')

        if (!permissionTree.has(current)) {
          permissionTree.set(current, new Set())
        }

        if (parent && parent !== current) {
          const children = permissionTree.get(parent) || new Set()
          children.add(current)
          permissionTree.set(parent, children)
        }
      }
    }

    // Convert to hierarchy array
    const visited = new Set<string>()

    const buildHierarchy = (node: string, level: number = 0, parent?: string) => {
      if (visited.has(node)) return
      visited.add(node)

      const children = Array.from(permissionTree.get(node) || [])
      hierarchy.push({
        permission: node,
        level,
        children,
        parent,
      })

      for (const child of children) {
        buildHierarchy(child, level + 1, node)
      }
    }

    if (rootPermission) {
      buildHierarchy(rootPermission)
    } else {
      // Find root nodes (no parent)
      const allChildren = new Set<string>()
      for (const children of permissionTree.values()) {
        children.forEach((child) => {
          allChildren.add(child)
        })
      }

      for (const node of permissionTree.keys()) {
        if (!allChildren.has(node)) {
          buildHierarchy(node)
        }
      }
    }

    return hierarchy
  }

  /**
   * Get permission statistics
   */
  async getPermissionStatistics(societeId?: string): Promise<{
    totalPermissions: number
    totalRoles: number
    totalUsers: number
    mostUsedPermissions: Array<{ permission: string; count: number }>
    leastUsedPermissions: Array<{ permission: string; count: number }>
    rolesWithMostPermissions: Array<{ role: string; count: number }>
    usersWithMostPermissions: Array<{ user: string; count: number }>
    permissionsByCategory: Record<string, number>
    conflictCount: number
  }> {
    const stats = {
      totalPermissions: 0,
      totalRoles: 0,
      totalUsers: 0,
      mostUsedPermissions: [] as Array<{ permission: string; count: number }>,
      leastUsedPermissions: [] as Array<{ permission: string; count: number }>,
      rolesWithMostPermissions: [] as Array<{ role: string; count: number }>,
      usersWithMostPermissions: [] as Array<{ user: string; count: number }>,
      permissionsByCategory: {} as Record<string, number>,
      conflictCount: 0,
    }

    // Total permissions
    stats.totalPermissions = await this.prisma.permission.count()

    // Total roles
    const roleWhere = societeId ? { OR: [{ societeId }, { societeId: null }] } : {}
    stats.totalRoles = await this.prisma.role.count({ where: roleWhere })

    // Total users with permissions
    const userWhere = societeId ? { societeId } : {}
    const distinctUsers = await this.prisma.userSocieteRole.findMany({
      where: userWhere,
      distinct: ['userId'],
      select: { userId: true },
    })
    stats.totalUsers = distinctUsers.length

    // Most/Least used permissions - use raw SQL for GROUP BY aggregations
    const permissionUsage = await this.prisma.$queryRaw<
      Array<{ permissionid: string; resource: string; action: string; count: bigint }>
    >`
      SELECT rp."permissionId" as permissionid, p.resource, p.action, COUNT(*) as count
      FROM "RolePermission" rp
      INNER JOIN "Permission" p ON rp."permissionId" = p.id
      GROUP BY rp."permissionId", p.resource, p.action
      ORDER BY count DESC
      LIMIT 10
    `

    stats.mostUsedPermissions = permissionUsage.map((p) => ({
      permission: `${p.resource}:${p.action}`,
      count: Number(p.count),
    }))

    const leastUsed = await this.prisma.$queryRaw<
      Array<{ permissionid: string; resource: string; action: string; count: bigint }>
    >`
      SELECT rp."permissionId" as permissionid, p.resource, p.action, COUNT(*) as count
      FROM "RolePermission" rp
      INNER JOIN "Permission" p ON rp."permissionId" = p.id
      GROUP BY rp."permissionId", p.resource, p.action
      ORDER BY count ASC
      LIMIT 10
    `

    stats.leastUsedPermissions = leastUsed.map((p) => ({
      permission: `${p.resource}:${p.action}`,
      count: Number(p.count),
    }))

    // Roles with most permissions
    const rolePermCounts = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; count: bigint }>
    >`
      SELECT r.id, r.name, COUNT(rp.id) as count
      FROM "Role" r
      LEFT JOIN "RolePermission" rp ON r.id = rp."roleId"
      GROUP BY r.id, r.name
      ORDER BY count DESC
      LIMIT 10
    `

    stats.rolesWithMostPermissions = rolePermCounts.map((r) => ({
      role: r.name,
      count: Number(r.count),
    }))

    // Permissions by category
    const permissions = await this.prisma.permission.findMany()
    for (const perm of permissions) {
      const category = perm.resource || 'uncategorized'
      stats.permissionsByCategory[category] = (stats.permissionsByCategory[category] || 0) + 1
    }

    return stats
  }

  /**
   * Build permission where clause for Prisma
   */
  private buildPermissionWhere(options: PermissionQueryOptions): any {
    if (options.conditions.length === 0) {
      return {}
    }

    const conditions = options.conditions.map((condition) =>
      this.buildPermissionConditionWhere(condition)
    )

    if (options.logic === 'OR') {
      return { OR: conditions }
    } else {
      return { AND: conditions }
    }
  }

  /**
   * Build single permission condition where clause
   */
  private buildPermissionConditionWhere(condition: PermissionCondition): any {
    const where: any = {}

    switch (condition.operator) {
      case PermissionOperator.HAS:
        if (condition.permissions?.length) {
          // Split permissions into resource:action pairs
          const orConditions = condition.permissions.map((perm) => {
            const [resource, action] = perm.split(':')
            return { resource, action }
          })
          where.OR = orConditions
        }
        break

      case PermissionOperator.HAS_NONE:
        if (condition.permissions?.length) {
          const notConditions = condition.permissions.map((perm) => {
            const [resource, action] = perm.split(':')
            return { NOT: { AND: [{ resource }, { action }] } }
          })
          where.AND = notConditions
        }
        break

      case PermissionOperator.STARTS_WITH:
        if (condition.pattern) {
          where.OR = [
            { resource: { startsWith: condition.pattern } },
            { action: { startsWith: condition.pattern } },
          ]
        }
        break

      case PermissionOperator.ENDS_WITH:
        if (condition.pattern) {
          where.OR = [
            { resource: { endsWith: condition.pattern } },
            { action: { endsWith: condition.pattern } },
          ]
        }
        break

      case PermissionOperator.CONTAINS:
        if (condition.pattern) {
          where.OR = [
            { resource: { contains: condition.pattern } },
            { action: { contains: condition.pattern } },
          ]
        }
        break
    }

    return where
  }

  /**
   * Build orderBy for Prisma
   */
  private buildOrderBy(options: PermissionQueryOptions): any {
    if (!options.sortBy) {
      return undefined
    }

    const sortOrder = (options.sortOrder || 'ASC').toLowerCase()
    return { [options.sortBy]: sortOrder }
  }

  /**
   * Build user permission where clause for Prisma
   */
  private buildUserPermissionWhere(
    conditions: PermissionCondition[],
    logic: 'AND' | 'OR'
  ): any {
    if (conditions.length === 0) {
      return {}
    }

    const whereConditions = conditions.map((condition) => {
      const userWhere: any = {}

      // Build permission filter
      if (condition.permissions?.length) {
        const permissionFilters = condition.permissions.map((perm) => {
          const [resource, action] = perm.split(':')
          return {
            societeRoles: {
              some: {
                role: {
                  permissions: {
                    some: {
                      permission: {
                        resource,
                        action,
                      },
                    },
                  },
                },
              },
            },
          }
        })

        switch (condition.operator) {
          case PermissionOperator.HAS:
          case PermissionOperator.HAS_ANY:
            userWhere.OR = permissionFilters
            break
          case PermissionOperator.HAS_ALL:
            userWhere.AND = permissionFilters
            break
          case PermissionOperator.HAS_NONE:
            userWhere.NOT = { OR: permissionFilters }
            break
        }
      }

      // Add societeId filter if provided
      if (condition.societeId && userWhere.societeRoles) {
        userWhere.societeRoles.some.societeId = condition.societeId
      }

      // Add siteId filter if provided
      if (condition.siteId && userWhere.societeRoles) {
        userWhere.societeRoles.some.allowedSiteIds = {
          has: condition.siteId,
        }
      }

      return userWhere
    })

    if (logic === 'OR') {
      return { OR: whereConditions }
    } else {
      return { AND: whereConditions }
    }
  }


  /**
   * Format permission results
   */
  private async formatPermissionResults(
    permissions: Permission[],
    options: PermissionQueryOptions
  ): Promise<PermissionQueryResult['permissions']> {
    const formatted = []

    for (const permission of permissions) {
      const result: {
        code: string
        name: string
        description?: string
        category?: string
        scope: PermissionScope
        users?: Array<{ id: string; email: string; name: string }>
        roles?: Array<{ id: string; code: string; name: string }>
        societes?: Array<{ id: string; name: string }>
      } = {
        code: `${permission.resource}:${permission.action}`,
        name: permission.name,
        description: permission.description || undefined,
        category: permission.resource || undefined, // Using resource as category
        scope: this.getPermissionScope(`${permission.resource}:${permission.action}`),
      }

      if (options.includeUsers) {
        // Get users with this permission
        const users = await this.findUsersWithPermission(
          `${permission.resource}:${permission.action}`
        )
        result.users = users.map((u) => ({
          id: u.id,
          email: u.email,
          name: `${u.prenom || ''} ${u.nom || ''}`.trim(),
        }))
      }

      if (options.includeRoles) {
        // Roles are already loaded if requested
        // Note: roles relation would need to be defined if needed
        result.roles = [] // permission.roles?.map(r => ({ id: r.id, code: r.code, name: r.name })) || []
      }

      formatted.push(result)
    }

    return formatted
  }

  /**
   * Format user results
   */
  private async formatUserResults(
    users: any[],
    conditions: PermissionCondition[]
  ): Promise<UserPermissionQueryResult['users']> {
    const formatted = []

    for (const user of users) {
      const permissions = new Set<string>()
      const roles = []
      const societes = []

      // Collect permissions and roles from societeRoles
      if (user.societeRoles) {
        for (const userRole of user.societeRoles) {
          if (userRole.role) {
            roles.push({
              code: userRole.role.parentRoleType || userRole.role.name,
              name: userRole.role.name,
            })

            // Add role permissions
            if (userRole.role.permissions) {
              for (const rolePerm of userRole.role.permissions) {
                if (rolePerm.permission) {
                  permissions.add(`${rolePerm.permission.resource}:${rolePerm.permission.action}`)
                }
              }
            }
          }

          // Add additional permissions from JSON
          const permissionsData = (userRole.permissions as any) || {}
          const additionalPermissions = permissionsData.additionalPermissions || []
          const restrictedPermissions = permissionsData.restrictedPermissions || []

          for (const perm of additionalPermissions) {
            permissions.add(perm)
          }

          // Remove restricted permissions
          for (const perm of restrictedPermissions) {
            permissions.delete(perm)
          }

          // Add societe info
          if (userRole.societe) {
            societes.push({
              id: userRole.societeId,
              name: userRole.societe.name || 'Unknown',
            })
          }
        }
      }

      // Count matched conditions
      let matchedConditions = 0
      for (const condition of conditions) {
        if (this.checkConditionMatch(Array.from(permissions), condition)) {
          matchedConditions++
        }
      }

      formatted.push({
        id: user.id,
        email: user.email,
        name: `${user.prenom || ''} ${user.nom || ''}`.trim(),
        permissions: Array.from(permissions),
        roles,
        societes,
        matchedConditions,
      })
    }

    return formatted
  }

  /**
   * Check if permissions match condition
   */
  private checkConditionMatch(permissions: string[], condition: PermissionCondition): boolean {
    switch (condition.operator) {
      case PermissionOperator.HAS:
        return condition.permissions?.some((p) => permissions.includes(p)) || false

      case PermissionOperator.HAS_ALL:
        return condition.permissions?.every((p) => permissions.includes(p)) || false

      case PermissionOperator.HAS_ANY:
        return condition.permissions?.some((p) => permissions.includes(p)) || false

      case PermissionOperator.HAS_NONE:
        return !condition.permissions?.some((p) => permissions.includes(p)) || true

      case PermissionOperator.MATCHES: {
        if (!condition.pattern) return false
        const regex = new RegExp(condition.pattern)
        return permissions.some((p) => regex.test(p))
      }

      case PermissionOperator.STARTS_WITH:
        return permissions.some((p) => p.startsWith(condition.pattern || ''))

      case PermissionOperator.ENDS_WITH:
        return permissions.some((p) => p.endsWith(condition.pattern || ''))

      case PermissionOperator.CONTAINS:
        return permissions.some((p) => p.includes(condition.pattern || ''))

      default:
        return false
    }
  }

  /**
   * Get permission scope from code
   */
  private getPermissionScope(code: string): PermissionScope {
    if (code.includes(':resource:')) {
      return PermissionScope.RESOURCE
    }
    if (code.includes(':site:')) {
      return PermissionScope.SITE
    }
    if (code.includes(':societe:')) {
      return PermissionScope.SOCIETE
    }
    return PermissionScope.GLOBAL
  }
}
