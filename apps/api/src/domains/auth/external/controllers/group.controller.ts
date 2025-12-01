import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { Public } from '../../../../core/multi-tenant'
import { Roles } from '../../decorators/roles.decorator'
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard'
import { RolesGuard } from '../../security/guards/roles.guard'
import { CreateGroupDto, GroupService, UpdateGroupDto } from '../../services/group.service'

@ApiTags('🔧 Admin - Groups')
@Controller('admin/groups')
@Public() // Bypass global TenantGuard - JwtAuthGuard handles JWT auth
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    const result = await this.groupService.findAllGroups({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })

    return {
      success: true,
      data: result.groups,
      meta: {
        total: result.total,
        page: page || 1,
        limit: limit || 20,
        totalPages: Math.ceil(result.total / (limit || 20)),
      },
    }
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findOne(@Param('id') id: string, @Query('includeUsers') includeUsers?: boolean) {
    const group = await this.groupService.findGroupById(id, includeUsers)
    return { success: true, data: group }
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const group = await this.groupService.createGroup(createGroupDto, req.user.id)
    return { success: true, data: group }
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const group = await this.groupService.updateGroup(id, updateGroupDto, req.user.id)
    return { success: true, data: group }
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async remove(@Param('id') id: string) {
    await this.groupService.deleteGroup(id)
    return { success: true }
  }

  // Gestion des membres du groupe
  @Get(':id/users')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getGroupUsers(@Param('id') id: string) {
    const users = await this.groupService.getGroupUsers(id)
    return { success: true, data: users }
  }

  @Post(':id/users')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async addUser(
    @Param('id') id: string,
    @Body() body: { userId: string; expiresAt?: Date },
    @Request() req: ExpressRequest & { user: { id: string } }
  ) {
    const userGroup = await this.groupService.addUserToGroup(
      body.userId,
      id,
      req.user.id
    )
    return { success: true, data: userGroup }
  }

  @Delete(':id/users/:userId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    await this.groupService.removeUserFromGroup(userId, id)
    return { success: true }
  }

  // NOTE: Group roles management removed - simplified schema
  // @Get(':id/roles')
  // @Roles('SUPER_ADMIN', 'ADMIN')
  // async getGroupRoles(@Param('id') id: string) {
  //   const roles = await this.groupService.getGroupRoles(id)
  //   return { success: true, data: roles }
  // }

  // @Put(':id/roles')
  // @Roles('SUPER_ADMIN')
  // async updateGroupRoles(@Param('id') id: string, @Body() body: { roleIds: string[] }) {
  //   await this.groupService.updateGroupRoles(id, body.roleIds)
  //   return { success: true }
  // }
}
