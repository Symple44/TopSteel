import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type { SocieteUsersService } from '../services/societe-users.service'
import type { SocietesService } from '../services/societes.service'

@ApiTags('Societes - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('societes')
export class SocieteUsersController {
  constructor(
    private readonly societeUsersService: SocieteUsersService,
    private readonly societesService: SocietesService
  ) {}

  @Get('users/:userId/companies')
  @ApiOperation({ summary: 'Get all company access for a user' })
  @ApiResponse({ status: 200, description: 'List of company access' })
  async getUserCompanies(@Param('userId') userId: string) {
    const userAccess = await this.societeUsersService.getUserCompanies(userId)
    return {
      data: userAccess,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  @Get(':societeId/users')
  @ApiOperation({ summary: 'Get all users for a company' })
  @ApiResponse({ status: 200, description: 'List of users with access' })
  async getCompanyUsers(@Param('societeId') societeId: string) {
    const users = await this.societeUsersService.getCompanyUsers(societeId)
    return {
      data: users,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  @Post(':societeId/users')
  @ApiOperation({ summary: 'Grant user access to a company' })
  @ApiResponse({ status: 201, description: 'Access granted' })
  async grantAccess(
    @Param('societeId') societeId: string,
    @Body() body: {
      userId: string
      role: string
      permissions?: string[]
      isActive?: boolean
    }
  ) {
    const access = await this.societeUsersService.grantUserAccess(
      societeId,
      body.userId,
      body.role,
      body.permissions || [],
      body.isActive !== false
    )
    return {
      data: access,
      statusCode: 201,
      message: 'Access granted successfully',
      timestamp: new Date().toISOString(),
    }
  }

  @Patch('users/:societeUserId')
  @ApiOperation({ summary: 'Update user access for a company' })
  @ApiResponse({ status: 200, description: 'Access updated' })
  async updateAccess(
    @Param('societeUserId') societeUserId: string,
    @Body() body: {
      role?: string
      permissions?: string[]
      isActive?: boolean
    }
  ) {
    const updated = await this.societeUsersService.updateUserAccess(societeUserId, body)
    return {
      data: updated,
      statusCode: 200,
      message: 'Access updated successfully',
      timestamp: new Date().toISOString(),
    }
  }

  @Patch('users/:societeUserId/permissions')
  @ApiOperation({ summary: 'Update user permissions for a company' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  async updatePermissions(
    @Param('societeUserId') societeUserId: string,
    @Body() body: { permissions: string[] }
  ) {
    const updated = await this.societeUsersService.updateUserPermissions(
      societeUserId,
      body.permissions
    )
    return {
      data: updated,
      statusCode: 200,
      message: 'Permissions updated successfully',
      timestamp: new Date().toISOString(),
    }
  }

  @Post('users/:userId/default-societe')
  @ApiOperation({ summary: 'Set default company for a user' })
  @ApiResponse({ status: 200, description: 'Default company set' })
  async setDefaultCompany(@Param('userId') userId: string, @Body() body: { societeId: string }) {
    await this.societeUsersService.setDefaultSociete(userId, body.societeId)
    return {
      statusCode: 200,
      message: 'Default company set successfully',
      timestamp: new Date().toISOString(),
    }
  }

  @Delete('users/:societeUserId')
  @ApiOperation({ summary: 'Revoke user access to a company' })
  @ApiResponse({ status: 200, description: 'Access revoked' })
  async revokeAccess(@Param('societeUserId') societeUserId: string) {
    await this.societeUsersService.revokeUserAccess(societeUserId)
    return {
      statusCode: 200,
      message: 'Access revoked successfully',
      timestamp: new Date().toISOString(),
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies (for dropdown)' })
  @ApiResponse({ status: 200, description: 'List of all companies' })
  async getAllCompanies() {
    const companies = await this.societesService.findAll()
    return {
      data: companies,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }
}
