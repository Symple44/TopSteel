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
import type { Request as ExpressRequest } from 'express'
import { Roles } from '../../decorators/roles.decorator'
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard'
import { RolesGuard } from '../../security/guards/roles.guard'
import { CreateGroupDto, GroupService, UpdateGroupDto } from '../../services/group.service'

@Controller('admin/groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll() {
    const groups = await this.groupService.findAllGroups()
    return { success: true, data: groups }
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
      req.user.id,
      body.expiresAt
    )
    return { success: true, data: userGroup }
  }

  @Delete(':id/users/:userId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    await this.groupService.removeUserFromGroup(userId, id)
    return { success: true }
  }

  // Gestion des rôles du groupe
  @Get(':id/roles')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getGroupRoles(@Param('id') id: string) {
    const roles = await this.groupService.getGroupRoles(id)
    return { success: true, data: roles }
  }

  @Put(':id/roles')
  @Roles('SUPER_ADMIN')
  async updateGroupRoles(@Param('id') id: string, @Body() body: { roleIds: string[] }) {
    await this.groupService.updateGroupRoles(id, body.roleIds)
    return { success: true }
  }
}
