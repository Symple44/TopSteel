import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { CombinedSecurityGuard, Resource, Action } from '../security/guards/combined-security.guard'
import { Roles } from '../decorators/roles.decorator'
import {
  PermissionQueryBuilderService,
  PermissionOperator,
  PermissionScope,
  PermissionCondition,
  PermissionQueryOptions,
  PermissionQueryResult,
  UserPermissionQueryResult,
  PermissionConflict,
} from '../services/permission-query-builder.service'

/**
 * Permission search request DTO
 */
export class PermissionSearchDto {
  conditions!: PermissionCondition[]
  logic?: 'AND' | 'OR'
  includeRoles?: boolean
  includeUsers?: boolean
  includeGroups?: boolean
  includeSocietes?: boolean
  sortBy?: 'permission' | 'user' | 'role' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
  limit?: number
  offset?: number
}

/**
 * User permission search DTO
 */
export class UserPermissionSearchDto {
  conditions!: PermissionCondition[]
  logic?: 'AND' | 'OR'
  sortBy?: 'user' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
  limit?: number
  offset?: number
}

/**
 * Permission pattern search DTO
 */
export class PermissionPatternSearchDto {
  pattern!: string
  operator?: PermissionOperator
}

/**
 * Permission conflict analysis DTO
 */
export class PermissionConflictAnalysisDto {
  userId!: string
  societeId!: string
}

/**
 * Permission search controller
 */
@ApiTags('Permissions - Advanced Search')
@ApiBearerAuth()
@Controller('api/permissions/search')
@UseGuards(CombinedSecurityGuard)
@Resource('permissions')
export class PermissionSearchController {
  constructor(
    private readonly queryBuilder: PermissionQueryBuilderService
  ) {}

  /**
   * Search permissions with complex queries
   */
  @Post('query')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('search')
  @ApiOperation({ summary: 'Search permissions with complex queries' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchPermissions(
    @Body() dto: PermissionSearchDto
  ): Promise<PermissionQueryResult> {
    // Validate conditions
    if (!dto.conditions || dto.conditions.length === 0) {
      throw new BadRequestException('At least one condition is required')
    }

    const options: PermissionQueryOptions = {
      conditions: dto.conditions,
      logic: dto.logic || 'AND',
      includeRoles: dto.includeRoles,
      includeUsers: dto.includeUsers,
      includeGroups: dto.includeGroups,
      includeSocietes: dto.includeSocietes,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
      limit: dto.limit || 100,
      offset: dto.offset || 0,
      cache: true,
      cacheKey: this.generateCacheKey('permissions', dto),
      cacheTTL: 300,
    }

    return await this.queryBuilder.queryPermissions(options)
  }

  /**
   * Search users by permissions
   */
  @Post('users')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('search')
  @ApiOperation({ summary: 'Search users by permissions' })
  @ApiResponse({ status: 200, description: 'User search results' })
  async searchUsersByPermissions(
    @Body() dto: UserPermissionSearchDto
  ): Promise<UserPermissionQueryResult> {
    // Validate conditions
    if (!dto.conditions || dto.conditions.length === 0) {
      throw new BadRequestException('At least one condition is required')
    }

    return await this.queryBuilder.queryUsersByPermissions(
      dto.conditions,
      {
        logic: dto.logic,
        sortBy: dto.sortBy,
        sortOrder: dto.sortOrder,
        limit: dto.limit || 100,
        offset: dto.offset || 0,
      }
    )
  }

  /**
   * Find users with specific permission
   */
  @Get('users-with-permission/:permission')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('read')
  @ApiOperation({ summary: 'Find users with specific permission' })
  @ApiResponse({ status: 200, description: 'Users with the permission' })
  async findUsersWithPermission(
    @Param('permission') permission: string,
    @Query('societeId') societeId?: string,
    @Query('siteId') siteId?: string
  ) {
    const users = await this.queryBuilder.findUsersWithPermission(
      permission,
      societeId,
      siteId
    )

    return {
      permission,
      societeId,
      siteId,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.prenom || ''} ${u.nom || ''}`.trim(),
      })),
      total: users.length,
    }
  }

  /**
   * Find permissions by pattern
   */
  @Post('pattern')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('search')
  @ApiOperation({ summary: 'Find permissions by pattern' })
  @ApiResponse({ status: 200, description: 'Permissions matching pattern' })
  async findPermissionsByPattern(
    @Body() dto: PermissionPatternSearchDto
  ) {
    const permissions = await this.queryBuilder.findPermissionsByPattern(
      dto.pattern,
      dto.operator || PermissionOperator.MATCHES
    )

    return {
      pattern: dto.pattern,
      operator: dto.operator || PermissionOperator.MATCHES,
      permissions: permissions.map(p => ({
        code: `${p.resource}:${p.action}`,
        name: p.name,
        description: p.description,
        category: p.resource, // Use resource as category
      })),
      total: permissions.length,
    }
  }

  /**
   * Analyze permission conflicts for a user
   */
  @Post('conflicts')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('analyze')
  @ApiOperation({ summary: 'Analyze permission conflicts for a user' })
  @ApiResponse({ status: 200, description: 'Permission conflicts' })
  async analyzePermissionConflicts(
    @Body() dto: PermissionConflictAnalysisDto
  ): Promise<{
    userId: string
    societeId: string
    conflicts: PermissionConflict[]
    total: number
  }> {
    const conflicts = await this.queryBuilder.analyzePermissionConflicts(
      dto.userId,
      dto.societeId
    )

    return {
      userId: dto.userId,
      societeId: dto.societeId,
      conflicts,
      total: conflicts.length,
    }
  }

  /**
   * Get permission hierarchy
   */
  @Get('hierarchy')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('read')
  @ApiOperation({ summary: 'Get permission hierarchy' })
  @ApiResponse({ status: 200, description: 'Permission hierarchy tree' })
  async getPermissionHierarchy(
    @Query('root') rootPermission?: string
  ) {
    const hierarchy = await this.queryBuilder.getPermissionHierarchy(rootPermission)

    return {
      root: rootPermission || 'all',
      hierarchy,
      total: hierarchy.length,
    }
  }

  /**
   * Get permission statistics
   */
  @Get('statistics')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('read')
  @ApiOperation({ summary: 'Get permission statistics' })
  @ApiResponse({ status: 200, description: 'Permission usage statistics' })
  async getPermissionStatistics(
    @Query('societeId') societeId?: string
  ) {
    const stats = await this.queryBuilder.getPermissionStatistics(societeId)

    return {
      societeId: societeId || 'all',
      statistics: stats,
      generatedAt: new Date(),
    }
  }

  /**
   * Search permissions with has operator
   */
  @Get('has')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('search')
  @ApiOperation({ summary: 'Find entities with specific permissions' })
  async searchWithHasOperator(
    @Query('permissions') permissions: string | string[],
    @Query('operator') operator: 'HAS' | 'HAS_ALL' | 'HAS_ANY' | 'HAS_NONE' = 'HAS',
    @Query('scope') scope?: PermissionScope,
    @Query('societeId') societeId?: string
  ) {
    const permArray = Array.isArray(permissions) ? permissions : [permissions]

    const condition: PermissionCondition = {
      operator: PermissionOperator[operator],
      permissions: permArray,
      scope,
      societeId,
    }

    const options: PermissionQueryOptions = {
      conditions: [condition],
      logic: 'AND',
      includeRoles: true,
      includeUsers: false,
      limit: 50,
      cache: true,
      cacheKey: `has:${operator}:${permArray.join(',')}:${scope}:${societeId}`,
      cacheTTL: 300,
    }

    return await this.queryBuilder.queryPermissions(options)
  }

  /**
   * Search permissions with pattern matching
   */
  @Get('match')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Action('search')
  @ApiOperation({ summary: 'Find permissions matching patterns' })
  async searchWithPatternMatching(
    @Query('pattern') pattern: string,
    @Query('operator') operator: 'MATCHES' | 'STARTS_WITH' | 'ENDS_WITH' | 'CONTAINS' = 'CONTAINS'
  ) {
    const condition: PermissionCondition = {
      operator: PermissionOperator[operator],
      pattern,
    }

    const options: PermissionQueryOptions = {
      conditions: [condition],
      logic: 'AND',
      includeRoles: true,
      limit: 100,
      cache: true,
      cacheKey: `pattern:${operator}:${pattern}`,
      cacheTTL: 300,
    }

    return await this.queryBuilder.queryPermissions(options)
  }

  /**
   * Complex permission query builder
   */
  @Post('complex-query')
  @Roles('SUPER_ADMIN')
  @Action('search')
  @ApiOperation({ summary: 'Execute complex permission query' })
  async executeComplexQuery(
    @Body() query: {
      must?: PermissionCondition[]
      should?: PermissionCondition[]
      mustNot?: PermissionCondition[]
      filter?: {
        societeId?: string
        siteId?: string
        resourceType?: string
      }
      options?: {
        includeRoles?: boolean
        includeUsers?: boolean
        limit?: number
        offset?: number
      }
    }
  ) {
    // Build conditions from complex query
    const conditions: PermissionCondition[] = []

    // Add must conditions (AND)
    if (query.must) {
      conditions.push(...query.must)
    }

    // Add filter conditions
    if (query.filter) {
      if (query.filter.societeId) {
        conditions.push({
          operator: PermissionOperator.HAS,
          societeId: query.filter.societeId,
        })
      }
      if (query.filter.siteId) {
        conditions.push({
          operator: PermissionOperator.HAS,
          siteId: query.filter.siteId,
        })
      }
      if (query.filter.resourceType) {
        conditions.push({
          operator: PermissionOperator.CONTAINS,
          pattern: query.filter.resourceType,
        })
      }
    }

    // Execute main query
    const mainResults = await this.queryBuilder.queryPermissions({
      conditions,
      logic: 'AND',
      ...query.options,
      cache: false,
    })

    // Handle should conditions (OR) separately if present
    let shouldResults: PermissionQueryResult | null = null
    if (query.should && query.should.length > 0) {
      shouldResults = await this.queryBuilder.queryPermissions({
        conditions: query.should,
        logic: 'OR',
        ...query.options,
        cache: false,
      })
    }

    // Handle mustNot conditions
    let excludedPermissions: string[] = []
    if (query.mustNot && query.mustNot.length > 0) {
      const mustNotResults = await this.queryBuilder.queryPermissions({
        conditions: query.mustNot,
        logic: 'OR',
        cache: false,
      })
      excludedPermissions = mustNotResults.permissions.map(p => p.code)
    }

    // Combine results
    let finalPermissions = mainResults.permissions

    // Add should results if any matched
    if (shouldResults) {
      const mainCodes = new Set(mainResults.permissions.map(p => p.code))
      const additionalPerms = shouldResults.permissions.filter(
        p => !mainCodes.has(p.code)
      )
      finalPermissions = [...finalPermissions, ...additionalPerms]
    }

    // Remove excluded permissions
    if (excludedPermissions.length > 0) {
      finalPermissions = finalPermissions.filter(
        p => !excludedPermissions.includes(p.code)
      )
    }

    return {
      query: {
        must: query.must,
        should: query.should,
        mustNot: query.mustNot,
        filter: query.filter,
      },
      results: {
        permissions: finalPermissions,
        total: finalPermissions.length,
        metadata: {
          executionTime: mainResults.metadata.executionTime,
          cached: false,
          complexity: 'complex',
        },
      },
    }
  }

  /**
   * Generate cache key for search
   */
  private generateCacheKey(prefix: string, dto: any): string {
    const hash = require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(dto))
      .digest('hex')
      .substring(0, 16)
    
    return `perm:search:${prefix}:${hash}`
  }
}