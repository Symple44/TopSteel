import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { AdminRolesService } from '../services/admin-roles.service'

@ApiTags('Admin - Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get(':roleId/permissions')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  @ApiResponse({ status: 200, description: 'List of permissions for the role' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    return await this.adminRolesService.getRolePermissions(roleId)
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles' })
  async getAllRoles() {
    return await this.adminRolesService.getAllRoles()
  }
}
