import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  Brackets,
  type Repository,
  type SelectQueryBuilder,
  type WhereExpressionBuilder,
} from 'typeorm'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import type {
  PermissionData,
  UserSocieteRole as UserSocieteRoleType,
} from '../../../types/entities/user.types'
import { User } from '../../users/entities/user.entity'
import { Permission } from '../core/entities/permission.entity'
import { Role } from '../core/entities/role.entity'
import { RolePermission } from '../core/entities/role-permission.entity'
import { UserSocieteRole } from '../core/entities/user-societe-role.entity'
import type { IRolePermission } from '../types/entities.types'
import { Permission, Role, RolePermission, User, UserSocieteRole } from '@prisma/client'

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission, 'auth')
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role, 'auth')
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission, 'auth')
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserSocieteRole, 'auth')
    private readonly userSocieteRoleRepository: Repository<UserSocieteRole>,
    private readonly cacheService: OptimizedCacheService
  ) {}

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

    // Build query
    const query = this.buildPermissionQuery(options)

    // Execute query
    const [permissions, total] = await query.getManyAndCount()

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

    // Build user query
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userSocieteRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.permissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')

    // Apply permission conditions
    this.applyUserPermissionConditions(query, conditions, options?.logic || 'AND')

    // Apply sorting
    if (options?.sortBy) {
      const sortOrder = options.sortOrder || 'ASC'
      switch (options.sortBy) {
        case 'user':
          query.orderBy('user.email', sortOrder)
          break
        case 'createdAt':
          query.orderBy('user.createdAt', sortOrder)
          break
      }
    }

    // Apply pagination
    if (options?.limit) {
      query.limit(options.limit)
    }
    if (options?.offset) {
      query.offset(options.offset)
    }

    // Execute query
    const [users, total] = await query.getManyAndCount()

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
    const query = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.userSocieteRoles', 'userRole')
      .innerJoin('userRole.role', 'role')
      .innerJoin('role.permissions', 'rolePermission')
      .innerJoin('rolePermission.permission', 'permission')
      .where("(permission.resource || ':' || permission.action) = :permission", { permission })

    if (societeId) {
      query.andWhere('userRole.societeId = :societeId', { societeId })
    }

    if (siteId) {
      query.andWhere(':siteId = ANY(userRole.allowedSites)', { siteId })
    }

    return await query.getMany()
  }

  /**
   * Find permissions by pattern
   */
  async findPermissionsByPattern(
    pattern: string,
    operator: PermissionOperator = PermissionOperator.MATCHES
  ): Promise<Permission[]> {
    const query = this.permissionRepository.createQueryBuilder('permission')

    switch (operator) {
      case PermissionOperator.STARTS_WITH:
        query.where("(permission.resource || ':' || permission.action) LIKE :pattern", {
          pattern: `${pattern}%`,
        })
        break
      case PermissionOperator.ENDS_WITH:
        query.where("(permission.resource || ':' || permission.action) LIKE :pattern", {
          pattern: `%${pattern}`,
        })
        break
      case PermissionOperator.CONTAINS:
        query.where("(permission.resource || ':' || permission.action) LIKE :pattern", {
          pattern: `%${pattern}%`,
        })
        break
      default:
        query.where("(permission.resource || ':' || permission.action) ~ :pattern", { pattern })
        break
    }

    return await query.getMany()
  }

  /**
   * Analyze permission conflicts for a user
   */
  async analyzePermissionConflicts(
    userId: string,
    societeId: string
  ): Promise<PermissionConflict[]> {
    // Get user's roles and permissions
    const userRoles = await this.userSocieteRoleRepository.find({
      where: { userId, societeId },
      relations: ['role', 'role.permissions', 'role.permissions.permission'],
    })

    const conflicts: PermissionConflict[] = []
    const permissionMap = new Map<string, PermissionConflict>()

    // Analyze each role
    for (const userRole of userRoles) {
      // Role permissions - vérifier que le rôle existe et a des permissions
      const role = userRole.role
      if (!role) continue

      for (const rolePerm of role.rolePermissions || []) {
        const rp = rolePerm as IRolePermission
        const permission = rp.permission as unknown as PermissionData
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

      // Additional permissions
      for (const addPerm of userRole.additionalPermissions || []) {
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

      // Restricted permissions
      for (const resPerm of userRole.restrictedPermissions || []) {
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
    const permissions = await this.permissionRepository.find()
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
    stats.totalPermissions = await this.permissionRepository.count()

    // Total roles
    const roleQuery = this.roleRepository.createQueryBuilder('role')
    if (societeId) {
      roleQuery.where('role.societeId = :societeId OR role.societeId IS NULL', { societeId })
    }
    stats.totalRoles = await roleQuery.getCount()

    // Total users with permissions
    const userQuery = this.userSocieteRoleRepository.createQueryBuilder('userRole')
    if (societeId) {
      userQuery.where('userRole.societeId = :societeId', { societeId })
    }
    stats.totalUsers = await userQuery
      .select('COUNT(DISTINCT userRole.userId)', 'count')
      .getRawOne()
      .then((r) => parseInt(r.count, 10))

    // Most used permissions
    const permissionUsage = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .select('rp.permissionId', 'permissionId')
      .addSelect('p.code', 'code')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('rp.permission', 'p')
      .groupBy('rp.permissionId, p.code')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    stats.mostUsedPermissions = permissionUsage.map((p) => ({
      permission: p.code,
      count: parseInt(p.count, 10),
    }))

    // Least used permissions
    const leastUsed = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .select('rp.permissionId', 'permissionId')
      .addSelect('p.code', 'code')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('rp.permission', 'p')
      .groupBy('rp.permissionId, p.code')
      .orderBy('count', 'ASC')
      .limit(10)
      .getRawMany()

    stats.leastUsedPermissions = leastUsed.map((p) => ({
      permission: p.code,
      count: parseInt(p.count, 10),
    }))

    // Roles with most permissions
    const rolePermCounts = await this.roleRepository
      .createQueryBuilder('role')
      .select('role.name', 'name')
      .addSelect('COUNT(rp.id)', 'count')
      .leftJoin('role.permissions', 'rp')
      .groupBy('role.id, role.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    stats.rolesWithMostPermissions = rolePermCounts.map((r) => ({
      role: r.name,
      count: parseInt(r.count, 10),
    }))

    // Permissions by category
    const permissions = await this.permissionRepository.find()
    for (const perm of permissions) {
      const category = perm.resource || 'uncategorized' // Use resource as category
      stats.permissionsByCategory[category] = (stats.permissionsByCategory[category] || 0) + 1
    }

    return stats
  }

  /**
   * Build permission query
   */
  private buildPermissionQuery(options: PermissionQueryOptions): SelectQueryBuilder<Permission> {
    const query = this.permissionRepository.createQueryBuilder('permission')

    // Apply conditions
    if (options.conditions.length > 0) {
      if (options.logic === 'OR') {
        query.where(
          new Brackets((qb) => {
            for (const condition of options.conditions) {
              qb.orWhere(
                new Brackets((subQb) => {
                  this.applyPermissionCondition(subQb, condition)
                })
              )
            }
          })
        )
      } else {
        for (const condition of options.conditions) {
          query.andWhere(
            new Brackets((qb) => {
              this.applyPermissionCondition(qb, condition)
            })
          )
        }
      }
    }

    // Include relations if requested
    if (options.includeRoles) {
      query.leftJoinAndSelect('permission.roles', 'role')
    }

    // Apply sorting
    if (options.sortBy) {
      const sortOrder = options.sortOrder || 'ASC'
      query.orderBy(`permission.${options.sortBy}`, sortOrder)
    }

    // Apply pagination
    if (options.limit) {
      query.limit(options.limit)
    }
    if (options.offset) {
      query.offset(options.offset)
    }

    return query
  }

  /**
   * Apply permission condition to query
   */
  private applyPermissionCondition(
    query: SelectQueryBuilder<Permission> | WhereExpressionBuilder,
    condition: PermissionCondition
  ): void {
    switch (condition.operator) {
      case PermissionOperator.HAS:
        if (condition.permissions?.length) {
          query.where("(permission.resource || ':' || permission.action) IN (:...permissions)", {
            permissions: condition.permissions,
          })
        }
        break

      case PermissionOperator.HAS_NONE:
        if (condition.permissions?.length) {
          query.where(
            "(permission.resource || ':' || permission.action) NOT IN (:...permissions)",
            {
              permissions: condition.permissions,
            }
          )
        }
        break

      case PermissionOperator.MATCHES:
        if (condition.pattern) {
          query.where("(permission.resource || ':' || permission.action) ~ :pattern", {
            pattern: condition.pattern,
          })
        }
        break

      case PermissionOperator.STARTS_WITH:
        if (condition.pattern) {
          query.where("(permission.resource || ':' || permission.action) LIKE :pattern", {
            pattern: `${condition.pattern}%`,
          })
        }
        break

      case PermissionOperator.ENDS_WITH:
        if (condition.pattern) {
          query.where("(permission.resource || ':' || permission.action) LIKE :pattern", {
            pattern: `%${condition.pattern}`,
          })
        }
        break

      case PermissionOperator.CONTAINS:
        if (condition.pattern) {
          query.where("(permission.resource || ':' || permission.action) LIKE :pattern", {
            pattern: `%${condition.pattern}%`,
          })
        }
        break
    }
  }

  /**
   * Apply user permission conditions
   */
  private applyUserPermissionConditions(
    query: SelectQueryBuilder<User>,
    conditions: PermissionCondition[],
    logic: 'AND' | 'OR'
  ): void {
    if (conditions.length === 0) return

    const brackets = new Brackets((qb) => {
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i]
        const subBrackets = new Brackets((subQb) => {
          switch (condition.operator) {
            case PermissionOperator.HAS:
              if (condition.permissions?.length === 1) {
                subQb.where(`(permission.resource || ':' || permission.action) = :perm${i}`, {
                  [`perm${i}`]: condition.permissions[0],
                })
              } else if (condition.permissions?.length) {
                subQb.where(
                  `(permission.resource || ':' || permission.action) IN (:...perms${i})`,
                  {
                    [`perms${i}`]: condition.permissions,
                  }
                )
              }
              break

            case PermissionOperator.HAS_ALL:
              if (condition.permissions?.length) {
                // This requires a more complex subquery
                for (const perm of condition.permissions) {
                  subQb.andWhere(
                    `EXISTS (
                      SELECT 1 FROM user_societe_roles usr2
                      JOIN roles r2 ON usr2.role_id = r2.id
                      JOIN role_permissions rp2 ON r2.id = rp2.role_id
                      JOIN permissions p2 ON rp2.permission_id = p2.id
                      WHERE usr2.user_id = user.id
                      AND p2.code = :perm_${i}_${perm}
                    )`,
                    { [`perm_${i}_${perm}`]: perm }
                  )
                }
              }
              break

            case PermissionOperator.HAS_ANY:
              if (condition.permissions?.length) {
                subQb.where(
                  `(permission.resource || ':' || permission.action) IN (:...perms${i})`,
                  {
                    [`perms${i}`]: condition.permissions,
                  }
                )
              }
              break

            case PermissionOperator.HAS_NONE:
              if (condition.permissions?.length) {
                subQb.where(
                  `(permission.resource || ':' || permission.action) NOT IN (:...perms${i})`,
                  {
                    [`perms${i}`]: condition.permissions,
                  }
                )
              }
              break

            case PermissionOperator.MATCHES:
              if (condition.pattern) {
                subQb.where(`(permission.resource || ':' || permission.action) ~ :pattern${i}`, {
                  [`pattern${i}`]: condition.pattern,
                })
              }
              break

            case PermissionOperator.STARTS_WITH:
              if (condition.pattern) {
                subQb.where(`(permission.resource || ':' || permission.action) LIKE :pattern${i}`, {
                  [`pattern${i}`]: `${condition.pattern}%`,
                })
              }
              break

            case PermissionOperator.CONTAINS:
              if (condition.pattern) {
                subQb.where(`(permission.resource || ':' || permission.action) LIKE :pattern${i}`, {
                  [`pattern${i}`]: `%${condition.pattern}%`,
                })
              }
              break
          }

          // Apply scope filters
          if (condition.societeId) {
            subQb.andWhere(`userRole.societeId = :societeId${i}`, {
              [`societeId${i}`]: condition.societeId,
            })
          }

          if (condition.siteId) {
            subQb.andWhere(`:siteId${i} = ANY(userRole.allowedSites)`, {
              [`siteId${i}`]: condition.siteId,
            })
          }
        })

        if (logic === 'OR') {
          qb.orWhere(subBrackets)
        } else {
          qb.andWhere(subBrackets)
        }
      }
    })

    query.where(brackets)
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
        description: permission.description,
        category: permission.resource, // Using resource as category
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
    users: User[],
    conditions: PermissionCondition[]
  ): Promise<UserPermissionQueryResult['users']> {
    const formatted = []

    for (const user of users) {
      const permissions = new Set<string>()
      const roles = []

      // Collect permissions and roles
      // Note: userSocieteRoles relation would need to be loaded separately
      // For now, we'll skip this part as the relation isn't defined in the User entity
      const userSocieteRoles = [] as UserSocieteRoleType[]
      for (const userRole of userSocieteRoles) {
        if (userRole.role) {
          roles.push({
            code: userRole.role.parentRoleType || userRole.role.name, // Use parentRoleType or name as code
            name: userRole.role.name,
          })

          for (const rolePerm of userRole.role.rolePermissions || []) {
            permissions.add(`${rolePerm.permission.resource}:${rolePerm.permission.action}`)
          }
        }

        // Add additional permissions
        for (const perm of userRole.additionalPermissions || []) {
          permissions.add(perm)
        }

        // Remove restricted permissions
        for (const perm of userRole.restrictedPermissions || []) {
          permissions.delete(perm)
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
        societes: [], // Would need to be loaded separately
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
