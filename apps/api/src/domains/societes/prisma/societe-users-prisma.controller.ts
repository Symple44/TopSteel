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
import { SocieteUserPrismaService } from './societe-user-prisma.service'
import { CombinedSecurityGuard } from '../../auth/security/guards/combined-security.guard'

// DTOs
interface AddUserToSocieteDto {
  userId: string
  societeId: string
  permissions?: Record<string, any>
  preferences?: Record<string, any>
  isActive?: boolean
}

interface UpdateSocieteUserDto {
  permissions?: Record<string, any>
  preferences?: Record<string, any>
  isActive?: boolean
}

/**
 * SocieteUsersPrismaController - Phase 8.1
 *
 * Contrôleur Prisma pour la gestion des associations utilisateurs-sociétés (Infrastructure Multi-Tenant)
 * Route: /societe-users-prisma
 *
 * Endpoints:
 * - GET    /societe-users-prisma/:id                    Détails association
 * - GET    /societe-users-prisma/user/:userId           Sociétés d'un utilisateur
 * - GET    /societe-users-prisma/societe/:societeId     Utilisateurs d'une société
 * - GET    /societe-users-prisma/user/:userId/societe/:societeId Vérifier membership
 * - GET    /societe-users-prisma/societe/:societeId/count Compter utilisateurs actifs
 * - GET    /societe-users-prisma/user/:userId/count      Compter sociétés actives
 * - POST   /societe-users-prisma                         Ajouter utilisateur à société
 * - PUT    /societe-users-prisma/:id                     Mettre à jour association
 * - PUT    /societe-users-prisma/:id/permissions         Mettre à jour permissions
 * - PUT    /societe-users-prisma/:id/preferences         Mettre à jour préférences
 * - PUT    /societe-users-prisma/:id/activate            Activer association
 * - PUT    /societe-users-prisma/:id/deactivate          Désactiver association
 * - DELETE /societe-users-prisma/user/:userId/societe/:societeId Retirer utilisateur
 */
@Controller('societe-users-prisma')
@ApiTags('👥 Utilisateurs Sociétés (Prisma - Multi-Tenant)')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class SocieteUsersPrismaController {
  constructor(private readonly societeUserPrismaService: SocieteUserPrismaService) {}

  /**
   * GET /societe-users-prisma/:id
   * Récupérer une association par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une association utilisateur-société par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Association récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Association non trouvée' })
  async findOne(@Param('id') id: string) {
    const societeUser = await this.societeUserPrismaService.getSocieteUserById(id)

    if (!societeUser) {
      return {
        success: false,
        message: 'Association non trouvée',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: societeUser,
    }
  }

  /**
   * GET /societe-users-prisma/user/:userId
   * Récupérer toutes les sociétés d'un utilisateur
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer les sociétés d\'un utilisateur (Prisma)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Sociétés récupérées avec succès' })
  async getUserSocietes(
    @Param('userId') userId: string,
    @Query('includeInactive') includeInactive?: boolean
  ) {
    const societes = await this.societeUserPrismaService.getUserSocietes(
      userId,
      includeInactive || false
    )

    return {
      success: true,
      data: societes,
      meta: {
        total: societes.length,
        userId,
        includeInactive: includeInactive || false,
      },
    }
  }

  /**
   * GET /societe-users-prisma/societe/:societeId
   * Récupérer tous les utilisateurs d'une société
   */
  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer les utilisateurs d\'une société (Prisma)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Utilisateurs récupérés avec succès' })
  async getSocieteUsers(
    @Param('societeId') societeId: string,
    @Query('includeInactive') includeInactive?: boolean
  ) {
    const users = await this.societeUserPrismaService.getSocieteUsers(
      societeId,
      includeInactive || false
    )

    return {
      success: true,
      data: users,
      meta: {
        total: users.length,
        societeId,
        includeInactive: includeInactive || false,
      },
    }
  }

  /**
   * GET /societe-users-prisma/user/:userId/societe/:societeId
   * Vérifier si un utilisateur est membre d'une société
   */
  @Get('user/:userId/societe/:societeId')
  @ApiOperation({ summary: 'Vérifier membership utilisateur-société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Vérification effectuée avec succès' })
  async checkMembership(
    @Param('userId') userId: string,
    @Param('societeId') societeId: string
  ) {
    const isMember = await this.societeUserPrismaService.isUserInSociete(userId, societeId)

    return {
      success: true,
      data: {
        userId,
        societeId,
        isMember,
      },
    }
  }

  /**
   * GET /societe-users-prisma/societe/:societeId/count
   * Compter les utilisateurs actifs d'une société
   */
  @Get('societe/:societeId/count')
  @ApiOperation({ summary: 'Compter les utilisateurs actifs d\'une société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Nombre d\'utilisateurs récupéré avec succès' })
  async countSocieteUsers(@Param('societeId') societeId: string) {
    const count = await this.societeUserPrismaService.countActiveSocieteUsers(societeId)

    return {
      success: true,
      data: {
        societeId,
        activeUsersCount: count,
      },
    }
  }

  /**
   * GET /societe-users-prisma/user/:userId/count
   * Compter les sociétés actives d'un utilisateur
   */
  @Get('user/:userId/count')
  @ApiOperation({ summary: 'Compter les sociétés actives d\'un utilisateur (Prisma)' })
  @ApiResponse({ status: 200, description: 'Nombre de sociétés récupéré avec succès' })
  async countUserSocietes(@Param('userId') userId: string) {
    const count = await this.societeUserPrismaService.countUserActiveSocietes(userId)

    return {
      success: true,
      data: {
        userId,
        activeSocietesCount: count,
      },
    }
  }

  /**
   * POST /societe-users-prisma
   * Ajouter un utilisateur à une société
   */
  @Post()
  @ApiOperation({ summary: 'Ajouter un utilisateur à une société (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        societeId: { type: 'string' },
        permissions: { type: 'object' },
        preferences: { type: 'object' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['userId', 'societeId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Utilisateur ajouté à la société avec succès' })
  @ApiResponse({ status: 409, description: 'Association déjà existante' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() addUserDto: AddUserToSocieteDto) {
    const societeUser = await this.societeUserPrismaService.addUserToSociete(addUserDto)

    return {
      success: true,
      data: societeUser,
      message: 'Utilisateur ajouté à la société avec succès',
      statusCode: 201,
    }
  }

  /**
   * PUT /societe-users-prisma/:id
   * Mettre à jour une association
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une association utilisateur-société (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        permissions: { type: 'object' },
        preferences: { type: 'object' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Association mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Association non trouvée' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateSocieteUserDto) {
    const societeUser = await this.societeUserPrismaService.updateSocieteUser(id, updateDto)

    return {
      success: true,
      data: societeUser,
      message: 'Association mise à jour avec succès',
    }
  }

  /**
   * PUT /societe-users-prisma/:id/permissions
   * Mettre à jour les permissions
   */
  @Put(':id/permissions')
  @ApiOperation({ summary: 'Mettre à jour les permissions (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        permissions: { type: 'object' },
      },
      required: ['permissions'],
    },
  })
  @ApiResponse({ status: 200, description: 'Permissions mises à jour avec succès' })
  async updatePermissions(@Param('id') id: string, @Body('permissions') permissions: Record<string, any>) {
    // Récupérer l'association pour obtenir userId et societeId
    const association = await this.societeUserPrismaService.getSocieteUserById(id)
    if (!association) {
      return { success: false, message: 'Association non trouvée', statusCode: 404 }
    }

    const societeUser = await this.societeUserPrismaService.updatePermissions(
      association.userId,
      association.societeId,
      permissions
    )

    return {
      success: true,
      data: societeUser,
      message: 'Permissions mises à jour avec succès',
    }
  }

  /**
   * PUT /societe-users-prisma/:id/preferences
   * Mettre à jour les préférences
   */
  @Put(':id/preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        preferences: { type: 'object' },
      },
      required: ['preferences'],
    },
  })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour avec succès' })
  async updatePreferences(@Param('id') id: string, @Body('preferences') preferences: Record<string, any>) {
    // Récupérer l'association pour obtenir userId et societeId
    const association = await this.societeUserPrismaService.getSocieteUserById(id)
    if (!association) {
      return { success: false, message: 'Association non trouvée', statusCode: 404 }
    }

    const societeUser = await this.societeUserPrismaService.updatePreferences(
      association.userId,
      association.societeId,
      preferences
    )

    return {
      success: true,
      data: societeUser,
      message: 'Préférences mises à jour avec succès',
    }
  }

  /**
   * PUT /societe-users-prisma/:id/activate
   * Activer une association
   */
  @Put(':id/activate')
  @ApiOperation({ summary: 'Activer une association utilisateur-société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Association activée avec succès' })
  async activate(@Param('id') id: string) {
    const societeUser = await this.societeUserPrismaService.getSocieteUserById(id)
    if (!societeUser) {
      return { success: false, message: 'Association non trouvée', statusCode: 404 }
    }

    const updated = await this.societeUserPrismaService.setActive(
      societeUser.userId,
      societeUser.societeId,
      true
    )

    return {
      success: true,
      data: updated,
      message: 'Association activée avec succès',
    }
  }

  /**
   * PUT /societe-users-prisma/:id/deactivate
   * Désactiver une association
   */
  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver une association utilisateur-société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Association désactivée avec succès' })
  async deactivate(@Param('id') id: string) {
    const societeUser = await this.societeUserPrismaService.getSocieteUserById(id)
    if (!societeUser) {
      return { success: false, message: 'Association non trouvée', statusCode: 404 }
    }

    const updated = await this.societeUserPrismaService.setActive(
      societeUser.userId,
      societeUser.societeId,
      false
    )

    return {
      success: true,
      data: updated,
      message: 'Association désactivée avec succès',
    }
  }

  /**
   * DELETE /societe-users-prisma/user/:userId/societe/:societeId
   * Retirer un utilisateur d'une société
   */
  @Delete('user/:userId/societe/:societeId')
  @ApiOperation({ summary: 'Retirer un utilisateur d\'une société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Utilisateur retiré de la société avec succès' })
  @ApiResponse({ status: 404, description: 'Association non trouvée' })
  async remove(
    @Param('userId') userId: string,
    @Param('societeId') societeId: string
  ) {
    await this.societeUserPrismaService.removeUserFromSociete(userId, societeId)

    return {
      success: true,
      message: 'Utilisateur retiré de la société avec succès',
    }
  }
}
