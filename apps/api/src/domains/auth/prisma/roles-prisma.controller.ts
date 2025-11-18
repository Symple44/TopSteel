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
import { RolePrismaService } from './role-prisma.service'
import { CombinedSecurityGuard } from '../security/guards/combined-security.guard'
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
 * RolesPrismaController - Phase 7.2
 *
 * Contrôleur Prisma pour la gestion des rôles
 * Route: /roles-prisma
 *
 * Endpoints:
 * - GET    /roles-prisma              Liste rôles
 * - GET    /roles-prisma/stats        Statistiques rôles
 * - GET    /roles-prisma/:id          Détails rôle
 * - POST   /roles-prisma              Créer rôle
 * - PUT    /roles-prisma/:id          Mettre à jour rôle
 * - DELETE /roles-prisma/:id          Supprimer rôle
 * - GET    /roles-prisma/:id/permissions         Permissions du rôle
 * - POST   /roles-prisma/:id/permissions         Assigner permission
 * - DELETE /roles-prisma/:id/permissions/:permId Révoquer permission
 * - GET    /roles-prisma/:id/users-count         Compter utilisateurs
 */
@Controller('roles-prisma')
@ApiTags('🔐 Roles (Prisma)')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class RolesPrismaController {
  constructor(private readonly rolePrismaService: RolePrismaService) {}

  /**
   * GET /roles-prisma
   * Liste des rôles avec filtres
   */
  @Get()
  @ApiOperation({ summary: 'Liste des rôles avec filtres (Prisma)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'societeId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des rôles récupérée avec succès' })
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
   * GET /roles-prisma/stats
   * Statistiques des rôles
   */
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des rôles (Prisma)' })
  @ApiQuery({ name: 'societeId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStats(@Query('societeId') societeId?: string) {
    const stats = await this.rolePrismaService.getStats(societeId)

    return {
      success: true,
      data: stats,
    }
  }

  /**
   * GET /roles-prisma/:id
   * Récupérer un rôle par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rôle par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Rôle récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async findOne(@Param('id') id: string) {
    const role = await this.rolePrismaService.findRoleById(id, true)

    if (!role) {
      return {
        success: false,
        message: 'Rôle non trouvé',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: role,
    }
  }

  /**
   * POST /roles-prisma
   * Créer un nouveau rôle
   */
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau rôle (Prisma)' })
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
  @ApiResponse({ status: 201, description: 'Rôle créé avec succès' })
  @ApiResponse({ status: 409, description: 'Nom de rôle déjà existant' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolePrismaService.create(createRoleDto)

    return {
      success: true,
      data: role,
      message: 'Rôle créé avec succès',
      statusCode: 201,
    }
  }

  /**
   * PUT /roles-prisma/:id
   * Mettre à jour un rôle
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un rôle (Prisma)' })
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
  @ApiResponse({ status: 200, description: 'Rôle mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  @ApiResponse({ status: 409, description: 'Impossible de modifier un rôle système' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const role = await this.rolePrismaService.updateRole(id, updateRoleDto)

    return {
      success: true,
      data: role,
      message: 'Rôle mis à jour avec succès',
    }
  }

  /**
   * DELETE /roles-prisma/:id
   * Supprimer un rôle
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rôle (Prisma)' })
  @ApiResponse({ status: 200, description: 'Rôle supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  @ApiResponse({ status: 409, description: 'Impossible de supprimer un rôle système ou utilisé' })
  async remove(@Param('id') id: string) {
    await this.rolePrismaService.deleteRole(id)

    return {
      success: true,
      message: 'Rôle supprimé avec succès',
    }
  }

  /**
   * GET /roles-prisma/:id/permissions
   * Récupérer les permissions d'un rôle
   */
  @Get(':id/permissions')
  @ApiOperation({ summary: 'Récupérer les permissions d\'un rôle (Prisma)' })
  @ApiResponse({ status: 200, description: 'Permissions récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async getRolePermissions(@Param('id') id: string) {
    const roleWithPermissions = await this.rolePrismaService.getRolePermissions(id)

    if (!roleWithPermissions) {
      return {
        success: false,
        message: 'Rôle non trouvé',
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
   * POST /roles-prisma/:id/permissions
   * Assigner une permission à un rôle
   */
  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assigner une permission à un rôle (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        permissionId: { type: 'string' },
      },
      required: ['permissionId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Permission assignée avec succès' })
  @ApiResponse({ status: 404, description: 'Rôle ou permission non trouvé' })
  @HttpCode(HttpStatus.CREATED)
  async assignPermission(
    @Param('id') roleId: string,
    @Body() body: AssignPermissionDto
  ) {
    await this.rolePrismaService.assignPermission(roleId, body.permissionId)

    return {
      success: true,
      message: 'Permission assignée avec succès',
      statusCode: 201,
    }
  }

  /**
   * DELETE /roles-prisma/:id/permissions/:permissionId
   * Révoquer une permission d'un rôle
   */
  @Delete(':id/permissions/:permissionId')
  @ApiOperation({ summary: 'Révoquer une permission d\'un rôle (Prisma)' })
  @ApiResponse({ status: 200, description: 'Permission révoquée avec succès' })
  async revokePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string
  ) {
    await this.rolePrismaService.revokePermission(roleId, permissionId)

    return {
      success: true,
      message: 'Permission révoquée avec succès',
    }
  }

  /**
   * GET /roles-prisma/:id/users-count
   * Compter les utilisateurs ayant ce rôle
   */
  @Get(':id/users-count')
  @ApiOperation({ summary: 'Compter les utilisateurs ayant ce rôle (Prisma)' })
  @ApiResponse({ status: 200, description: 'Nombre d\'utilisateurs récupéré avec succès' })
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
