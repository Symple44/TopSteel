import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { AccessLevel } from '../core/entities/permission.entity'
import { Roles } from '../decorators/roles.decorator'
import { JwtAuthGuard } from '../security/guards/jwt-auth.guard'
import { RolesGuard } from '../security/guards/roles.guard'
import { CreateRoleDto, RoleService, UpdateRoleDto } from '../services/role.service'

/**
 * @deprecated This controller uses TypeORM and is kept for backward compatibility only.
 * Use RolesController (Prisma-based) at /roles/* endpoints instead.
 * This legacy controller will be removed in v3.0.0.
 *
 * Migration: Replace /admin/roles-legacy/* with /roles/* in your API calls.
 */
@ApiTags('🔐 Roles (Legacy - Deprecated)')
@Controller('admin/roles-legacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleLegacyController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer tous les rôles' })
  @ApiQuery({ name: 'includePermissions', required: false, type: Boolean })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des rôles récupérée avec succès' })
  async findAllRoles(@Query('includePermissions') includePermissions: string = 'false') {
    try {
      const include = includePermissions === 'true'
      const roles = await this.roleService.findAllRoles(include)

      return {
        success: true,
        data: roles,
        meta: {
          total: roles.length,
          systemRoles: roles.filter((r) => r.isSystemRole).length,
          customRoles: roles.filter((r) => !r.isSystemRole).length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des rôles',
      }
    }
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Récupérer un rôle par ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rôle récupéré avec succès' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rôle non trouvé' })
  async findRoleById(@Param('id') id: string) {
    try {
      const role = await this.roleService.findRoleById(id, true)

      return {
        success: true,
        data: role,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération du rôle',
      }
    }
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Créer un nouveau rôle' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Rôle créé avec succès' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Un rôle avec ce nom existe déjà' })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @Request() req: { user?: { id: string } }
  ) {
    try {
      const userId = req.user?.id || 'system'
      const role = await this.roleService.createRole(createRoleDto, userId)

      return {
        success: true,
        data: role,
        message: 'Rôle créé avec succès',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la création du rôle',
      }
    }
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Mettre à jour un rôle' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rôle mis à jour avec succès' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rôle non trouvé' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Modification interdite pour les rôles système',
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: { user?: { id: string } }
  ) {
    try {
      const userId = req.user?.id || 'system'
      const role = await this.roleService.updateRole(id, updateRoleDto, userId)

      return {
        success: true,
        data: role,
        message: 'Rôle mis à jour avec succès',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du rôle',
      }
    }
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rôle supprimé avec succès' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Rôle non trouvé' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Suppression interdite pour les rôles système',
  })
  async deleteRole(@Param('id') id: string) {
    try {
      await this.roleService.deleteRole(id)

      return {
        success: true,
        message: 'Rôle supprimé avec succès',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du rôle',
      }
    }
  }

  @Get(':id/permissions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: "Récupérer les permissions d'un rôle" })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permissions récupérées avec succès' })
  async getRolePermissions(@Param('id') id: string) {
    try {
      const permissions = await this.roleService.getRolePermissions(id)

      return {
        success: true,
        data: permissions,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur lors de la récupération des permissions',
      }
    }
  }

  @Post(':id/permissions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: "Mettre à jour les permissions d'un rôle" })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permissions mises à jour avec succès' })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() body: {
      permissions: {
        permissionId: string
        accessLevel: AccessLevel
        isGranted: boolean
      }[]
    },
    @Request() req: { user?: { id: string } }
  ) {
    try {
      const userId = req.user?.id || 'system'
      await this.roleService.updateRolePermissions(id, body.permissions, userId)

      return {
        success: true,
        message: 'Permissions mises à jour avec succès',
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur lors de la mise à jour des permissions',
      }
    }
  }

  @Post(':id/users/:userId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Assigner un utilisateur à un rôle' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Utilisateur assigné avec succès' })
  async assignUserToRole(
    @Param('id') roleId: string,
    @Param('userId') userId: string,
    @Body() body: { expiresAt?: string },
    @Request() req: { user?: { id: string } }
  ) {
    try {
      const assignedBy = req.user?.id || 'system'
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined

      const userRole = await this.roleService.assignUserToRole(
        userId,
        roleId,
        assignedBy,
        expiresAt
      )

      return {
        success: true,
        data: userRole,
        message: 'Utilisateur assigné au rôle avec succès',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur lors de l'assignation du rôle",
      }
    }
  }

  @Delete(':id/users/:userId')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: "Retirer un utilisateur d'un rôle" })
  @ApiResponse({ status: HttpStatus.OK, description: 'Utilisateur retiré avec succès' })
  async removeUserFromRole(@Param('id') roleId: string, @Param('userId') userId: string) {
    try {
      await this.roleService.removeUserFromRole(userId, roleId)

      return {
        success: true,
        message: 'Utilisateur retiré du rôle avec succès',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du retrait du rôle',
      }
    }
  }
}
