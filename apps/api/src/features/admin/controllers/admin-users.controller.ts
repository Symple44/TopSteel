import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  GlobalUserRole,
  SocieteRoleType,
} from '../../../domains/auth/core/constants/roles.constants'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { RequireSocieteContext } from '../../../domains/auth/security/guards/enhanced-tenant.guard'
import type { RoleFormattingService } from '../../../domains/auth/services/role-formatting.service'
import type { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import { CreateUserDto } from '../../../domains/users/dto/create-user.dto'
import { UpdateUserDto } from '../../../domains/users/dto/update-user.dto'
import type { UserQueryDto } from '../../../domains/users/dto/user-query.dto'
import type { UsersService } from '../../../domains/users/users.service'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'

@Controller('admin/users')
@ApiTags('🔧 Admin - Users')
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly roleFormattingService: RoleFormattingService,
    private readonly cacheService: OptimizedCacheService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs (Administration)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'includePermissions',
    required: false,
    type: Boolean,
    description: 'Inclure les permissions dans la réponse',
  })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  async findAllUsers(@Query() query: UserQueryDto & { includePermissions?: boolean }) {
    // Créer une clé de cache basée sur les paramètres de requête
    const cacheKey = `admin:users:${JSON.stringify(query)}`

    // Vérifier le cache d'abord
    const cachedResult = await this.cacheService.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    const users = await this.usersService.findAll(query)

    // Adapter les données avec le formatage des rôles amélioré
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const formattedGlobalRole = user.role
          ? this.roleFormattingService.formatGlobalRole(user.role as GlobalUserRole)
          : null

        // Récupérer les rôles société si demandé
        let societeRoles: Record<string, unknown>[] = []
        if (query.includePermissions) {
          const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
          societeRoles = userSocieteRoles.map((roleInfo) => ({
            societeId: roleInfo.societeId,
            role: this.roleFormattingService.formatSocieteRole(roleInfo.societeRole),
            effectiveRole: this.roleFormattingService.formatSocieteRole(roleInfo.effectiveRole),
            isDefault: roleInfo.isDefaultSociete,
            isActive: roleInfo.isActive,
            expiresAt: roleInfo.expiresAt,
          }))
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.prenom || '',
          lastName: user.nom || '',
          acronym: user.acronyme || '',
          phone: null, // Non disponible dans notre entité
          department: null, // Non disponible dans notre entité
          isActive: user.actif,
          createdAt: user.createdAt,
          lastLogin: user.dernier_login,
          globalRole: formattedGlobalRole,
          // Maintenir la compatibilité avec l'ancien format
          roles: formattedGlobalRole
            ? [
                {
                  id: formattedGlobalRole.id,
                  name: formattedGlobalRole.displayName,
                  description: formattedGlobalRole.description,
                  color: formattedGlobalRole.color,
                  icon: formattedGlobalRole.icon,
                  hierarchy: formattedGlobalRole.hierarchy,
                  assignedAt: user.createdAt || new Date().toISOString(),
                },
              ]
            : [],
          societeRoles,
          groups: [], // Pas de groupes dans notre système actuel
          permissions: query.includePermissions ? await this.getUserPermissions(user.id) : []
        }
      })
    )

    const result = {
      success: true,
      data: formattedUsers,
      meta: {
        total: formattedUsers.length,
        includePermissions: query.includePermissions || false,
      },
    }

    // Mettre en cache pour 2 minutes (120 secondes)
    await this.cacheService.set(cacheKey, result, 120)

    return result
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques administrateur des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getAdminStats() {
    return this.usersService.getStats()
  }

  @Get('roles')
  @ApiOperation({ summary: 'Récupérer tous les rôles disponibles avec leur formatage' })
  @ApiResponse({ status: 200, description: 'Liste des rôles formatés récupérée avec succès' })
  async getAvailableRoles() {
    const globalRoles = this.roleFormattingService.getAllFormattedGlobalRoles()
    const societeRoles = this.roleFormattingService.getAllFormattedSocieteRoles()

    return {
      success: true,
      data: {
        globalRoles,
        societeRoles,
        css: this.roleFormattingService.getRoleBadgeCSS(),
      },
      message: 'Rôles formatés récupérés avec succès',
      statusCode: 200,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer les détails d'un utilisateur" })
  @ApiResponse({ status: 200, description: "Détails de l'utilisateur récupérés avec succès" })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id)

    if (!user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
        statusCode: 404,
      }
    }

    // Formatter les données avec le formatage des rôles amélioré
    const formattedGlobalRole = user.role
      ? this.roleFormattingService.formatGlobalRole(user.role as GlobalUserRole)
      : null

    // Récupérer les rôles société pour cet utilisateur
    const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
    const societeRoles = userSocieteRoles.map((roleInfo) => ({
      societeId: roleInfo.societeId,
      role: this.roleFormattingService.formatSocieteRole(roleInfo.societeRole),
      effectiveRole: this.roleFormattingService.formatSocieteRole(roleInfo.effectiveRole),
      isDefault: roleInfo.isDefaultSociete,
      isActive: roleInfo.isActive,
      grantedAt: roleInfo.expiresAt,
      additionalPermissions: roleInfo.additionalPermissions,
      restrictedPermissions: roleInfo.restrictedPermissions,
    }))

    const formattedUser = {
      id: user.id,
      email: user.email,
      firstName: user.prenom || '',
      lastName: user.nom || '',
      acronym: user.acronyme || '',
      phone: null, // Non disponible dans notre entité
      department: null, // Non disponible dans notre entité
      isActive: user.actif,
      lastLogin: user.dernier_login,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      globalRole: formattedGlobalRole,
      // Maintenir la compatibilité avec l'ancien format
      roles: formattedGlobalRole
        ? [
            {
              id: formattedGlobalRole.id,
              name: formattedGlobalRole.displayName,
              description: formattedGlobalRole.description,
              color: formattedGlobalRole.color,
              icon: formattedGlobalRole.icon,
              hierarchy: formattedGlobalRole.hierarchy,
            },
          ]
        : [],
      societeRoles,
      groups: [], // Pas de groupes dans notre système actuel
    }

    return {
      success: true,
      data: formattedUser,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà existant' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      // Validation supplémentaire pour les rôles
      if (
        createUserDto.role &&
        !Object.values(GlobalUserRole).includes(createUserDto.role as GlobalUserRole)
      ) {
        throw new BadRequestException('Rôle invalide')
      }

      const user = await this.usersService.create(createUserDto)

      // Invalider le cache des utilisateurs
      await this.invalidateUsersCache()

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.prenom || '',
          lastName: user.nom || '',
          role: user.role,
          isActive: user.actif,
          createdAt: user.createdAt,
        },
        message: 'Utilisateur créé avec succès',
        statusCode: 201,
      }
    } catch (error: unknown) {
      if ((error as any).code === '23505') {
        // Violation de contrainte unique PostgreSQL
        throw new BadRequestException('Un utilisateur avec cet email existe déjà')
      }
      throw error
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await this.usersService.findById(id)
      if (!existingUser) {
        throw new NotFoundException('Utilisateur non trouvé')
      }

      // Validation supplémentaire pour les rôles si fourni
      if (
        updateUserDto.role &&
        !Object.values(GlobalUserRole).includes(updateUserDto.role as GlobalUserRole)
      ) {
        throw new BadRequestException('Rôle invalide')
      }

      await this.usersService.update(id, updateUserDto)
      const updatedUser = await this.usersService.findById(id)

      if (!updatedUser) {
        throw new NotFoundException('Utilisateur non trouvé après mise à jour')
      }

      // Invalider le cache des utilisateurs
      await this.invalidateUsersCache()

      return {
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.prenom || '',
          lastName: updatedUser.nom || '',
          role: updatedUser.role,
          isActive: updatedUser.actif,
          updatedAt: updatedUser.updatedAt,
        },
        message: 'Utilisateur mis à jour avec succès',
        statusCode: 200,
      }
    } catch (error: unknown) {
      if ((error as any).code === '23505') {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà')
      }
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer cet utilisateur' })
  async deleteUser(@Param('id') id: string) {
    // Vérifier que l'utilisateur existe
    const existingUser = await this.usersService.findById(id)
    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé')
    }

    // Protection : empêcher la suppression des utilisateurs système
    if (
      existingUser.email === 'admin@topsteel.tech' ||
      existingUser.email === 'test@topsteel.com'
    ) {
      throw new BadRequestException('Impossible de supprimer un utilisateur système')
    }

    try {
      await this.usersService.remove(id)

      // Invalider le cache des utilisateurs
      await this.invalidateUsersCache()

      return {
        success: true,
        message: 'Utilisateur supprimé avec succès',
        statusCode: 200,
      }
    } catch (_error: unknown) {
      throw new BadRequestException("Erreur lors de la suppression de l'utilisateur")
    }
  }

  @Post(':id/roles')
  @RequireSocieteContext()
  @ApiOperation({ summary: 'Assigner un rôle société à un utilisateur' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roleType: { type: 'string', enum: Object.values(SocieteRoleType) },
        isDefault: { type: 'boolean', default: false },
        additionalPermissions: { type: 'array', items: { type: 'string' } },
        restrictedPermissions: { type: 'array', items: { type: 'string' } },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
      required: ['roleType'],
    },
  })
  @ApiResponse({ status: 201, description: 'Rôle assigné avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async assignSocieteRole(
    @Param('id') userId: string,
    @Body() body: {
      roleType: SocieteRoleType
      isDefault?: boolean
      additionalPermissions?: string[]
      restrictedPermissions?: string[]
      expiresAt?: Date
    },
    request: Record<string, unknown>
  ) {
    const tenant = request.tenant
    const currentUser = request.user

    // Vérifier que l'utilisateur existe
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé')
    }

    // Validation du rôle
    if (!Object.values(SocieteRoleType).includes(body.roleType)) {
      throw new BadRequestException('Type de rôle invalide')
    }

    try {
      const userSocieteRole = await this.unifiedRolesService.assignUserToSociete(
        userId,
        (tenant as any).societeId,
        body.roleType,
        (currentUser as any).id,
        {
          isDefault: body.isDefault || false,
          additionalPermissions: body.additionalPermissions || [],
          restrictedPermissions: body.restrictedPermissions || [],
          expiresAt: body.expiresAt,
        }
      )

      return {
        success: true,
        data: {
          id: userSocieteRole.id,
          userId: userSocieteRole.userId,
          societeId: userSocieteRole.societeId,
          roleType: userSocieteRole.roleType,
          isDefault: userSocieteRole.isDefaultSociete,
          isActive: userSocieteRole.isActive,
          grantedAt: userSocieteRole.grantedAt,
        },
        message: 'Rôle société assigné avec succès',
        statusCode: 201,
      }
    } catch (_error: unknown) {
      throw new BadRequestException("Erreur lors de l'assignation du rôle")
    }
  }

  @Delete(':id/roles/:societeId')
  @RequireSocieteContext()
  @ApiOperation({ summary: "Révoquer l'accès d'un utilisateur à une société" })
  @ApiResponse({ status: 200, description: 'Accès révoqué avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou rôle non trouvé' })
  async revokeSocieteAccess(@Param('id') userId: string, @Param('societeId') societeId: string) {
    const success = await this.unifiedRolesService.revokeUserFromSociete(userId, societeId)

    if (!success) {
      throw new NotFoundException('Utilisateur ou rôle société non trouvé')
    }

    return {
      success: true,
      message: 'Accès à la société révoqué avec succès',
      statusCode: 200,
    }
  }

  @Get(':id/societes')
  @ApiOperation({ summary: 'Lister les sociétés accessibles par un utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des sociétés récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserSocietes(@Param('id') userId: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé')
    }

    const userSocietes = await this.unifiedRolesService.getUserSocieteRoles(userId)

    return {
      success: true,
      data: userSocietes.map((info) => ({
        societeId: info.societeId,
        globalRole: info.globalRole,
        societeRole: info.societeRole,
        effectiveRole: info.effectiveRole,
        isDefaultSociete: info.isDefaultSociete,
        isActive: info.isActive,
        permissions: info.permissions,
        additionalPermissions: info.additionalPermissions,
        restrictedPermissions: info.restrictedPermissions,
        expiresAt: info.expiresAt,
      })),
      message: 'Liste des sociétés récupérée avec succès',
      statusCode: 200,
    }
  }

  /**
   * Récupère les permissions d'un utilisateur
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Récupérer les permissions via le service unifié de rôles
      const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(userId)
      
      // Collecter toutes les permissions des différents rôles
      const allPermissions = new Set<string>()
      
      for (const roleInfo of userSocieteRoles) {
        // Ajouter les permissions du rôle
        if (roleInfo.permissions) {
          roleInfo.permissions.forEach(permission => allPermissions.add(permission))
        }
        
        // Ajouter les permissions additionnelles
        if (roleInfo.additionalPermissions) {
          roleInfo.additionalPermissions.forEach(permission => allPermissions.add(permission))
        }
        
        // Retirer les permissions restreintes
        if (roleInfo.restrictedPermissions) {
          roleInfo.restrictedPermissions.forEach(permission => allPermissions.delete(permission))
        }
      }
      
      return Array.from(allPermissions)
    } catch (error) {
      this.logger?.warn('Erreur lors de la récupération des permissions utilisateur:', error)
      return []
    }
  }

  /**
   * Invalide le cache des utilisateurs
   */
  private async invalidateUsersCache(): Promise<void> {
    try {
      // Simple suppression de quelques clés de cache communes
      const commonKeys = [
        'admin:users:{}',
        'admin:users:{"page":1,"limit":10}',
        'admin:users:{"includePermissions":true}',
      ]

      for (const key of commonKeys) {
        await this.cacheService.delete(key)
      }
    } catch (_error) {}
  }
}
