import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger'
import { RolePrismaService } from './prisma/role-prisma.service'
import { CombinedSecurityGuard } from './security/guards/combined-security.guard'
import { Prisma } from '@prisma/client'

// DTOs
interface CreateRoleDto {
  name: string
  label: string
  description?: string
  level?: number
  isSystem?: boolean
  isActive?: boolean
  societeId?: string
  parentId?: string
  metadata?: Prisma.InputJsonValue
}

interface UpdateRoleDto {
  name?: string
  label?: string
  description?: string
  level?: number
  isActive?: boolean
  societeId?: string
  parentId?: string
  metadata?: Prisma.InputJsonValue
}

interface AssignPermissionDto {
  permissionId: string
}

interface RoleQueryDto {
  includeInactive?: boolean
  societeId?: string
}

/**
 * RolesController - Prisma-based Role Management
 *
 * Primary role management controller using Prisma ORM
 * Route: /roles
 *
 * Endpoints:
 * - GET    /roles              List roles
 * - GET    /roles/stats        Role statistics
 * - GET    /roles/:id          Role details
 * - POST   /roles              Create role
 * - PUT    /roles/:id          Update role
 * - DELETE /roles/:id          Delete role
 * - GET    /roles/:id/permissions         Get role permissions
 * - POST   /roles/:id/permissions         Assign permission
 * - DELETE /roles/:id/permissions/:permId Revoke permission
 * - GET    /roles/:id/users-count         Count role users
 *
 * @see /admin/roles-legacy/* for deprecated TypeORM endpoints
 */
@Controller('roles')
@ApiTags('🔐 Roles')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly rolePrismaService: RolePrismaService) {}

  /**
   * GET /roles
   * List roles with filters
   */
  @Get()
  @ApiOperation({ summary: 'List roles with filters' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'societeId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async findAll(@Query() query: RoleQueryDto) {
    const roles = await this.rolePrismaService.findAllRoles(
      query.includeInactive || false,
      query.societeId
    )

    return {
      success: true,
      data: roles,
      meta: {
        total: roles.length,
        includeInactive: query.includeInactive || false,
        societeId: query.societeId,
      },
    }
  }

  /**
   * GET /roles/stats
   * Role statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Role statistics' })
  @ApiQuery({ name: 'societeId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Query('societeId') societeId?: string) {
    const stats = await this.rolePrismaService.getStats(societeId)

    return {
      success: true,
      data: stats,
    }
  }

  /**
   * GET /roles/:id
   * Get role by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string) {
    const role = await this.rolePrismaService.findRoleById(id, true)

    if (!role) {
      return {
        success: false,
        message: 'Role not found',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: role,
    }
  }

  /**
   * POST /roles
   * Create a new role
   */
  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        label: { type: 'string' },
        description: { type: 'string' },
        level: { type: 'number', default: 0 },
        isSystem: { type: 'boolean', default: false },
        isActive: { type: 'boolean', default: true },
        societeId: { type: 'string' },
        parentId: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['name', 'label'],
    },
  })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolePrismaService.create(createRoleDto)

    return {
      success: true,
      data: role,
      message: 'Role created successfully',
      statusCode: 201,
    }
  }

  /**
   * PUT /roles/:id
   * Update a role
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        label: { type: 'string' },
        description: { type: 'string' },
        level: { type: 'number' },
        isActive: { type: 'boolean' },
        societeId: { type: 'string' },
        parentId: { type: 'string' },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Cannot modify system role' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolePrismaService.updateRole(id, updateRoleDto)

    return {
      success: true,
      data: role,
      message: 'Role updated successfully',
    }
  }

  /**
   * DELETE /roles/:id
   * Delete a role
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete system role or role in use' })
  async remove(@Param('id') id: string) {
    await this.rolePrismaService.deleteRole(id)

    return {
      success: true,
      message: 'Role deleted successfully',
    }
  }

  /**
   * GET /roles/:id/permissions
   * Get role permissions
   */
  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(@Param('id') id: string) {
    const roleWithPermissions = await this.rolePrismaService.getRolePermissions(id)

    if (!roleWithPermissions) {
      return {
        success: false,
        message: 'Role not found',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: {
        roleId: roleWithPermissions.id,
        roleName: roleWithPermissions.name,
        permissions: roleWithPermissions.permissions,
        total: roleWithPermissions.permissions.length,
      },
    }
  }

  /**
   * POST /roles/:id/permissions
   * Assign permission to role
   */
  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        permissionId: { type: 'string' },
      },
      required: ['permissionId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Permission assigned successfully' })
  @ApiResponse({ status: 404, description: 'Role or permission not found' })
  @HttpCode(HttpStatus.CREATED)
  async assignPermission(
    @Param('id') roleId: string,
    @Body() body: AssignPermissionDto
  ) {
    await this.rolePrismaService.assignPermission(roleId, body.permissionId)

    return {
      success: true,
      message: 'Permission assigned successfully',
      statusCode: 201,
    }
  }

  /**
   * DELETE /roles/:id/permissions/:permissionId
   * Revoke permission from role
   */
  @Delete(':id/permissions/:permissionId')
  @ApiOperation({ summary: 'Revoke permission from role' })
  @ApiResponse({ status: 200, description: 'Permission revoked successfully' })
  async revokePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string
  ) {
    await this.rolePrismaService.revokePermission(roleId, permissionId)

    return {
      success: true,
      message: 'Permission revoked successfully',
    }
  }

  /**
   * GET /roles/:id/users-count
   * Count users with this role
   */
  @Get(':id/users-count')
  @ApiOperation({ summary: 'Count users with this role' })
  @ApiResponse({ status: 200, description: 'User count retrieved successfully' })
  async countUsers(@Param('id') id: string) {
    const count = await this.rolePrismaService.countUsersWithRole(id)

    return {
      success: true,
      data: {
        roleId: id,
        userCount: count,
      },
    }
  }
}
