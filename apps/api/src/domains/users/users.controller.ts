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
import { UsersPrismaService } from './users-prisma.service'
import { CombinedSecurityGuard } from '../auth/security/guards/combined-security.guard'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto'
import { UserQueryDto } from './dto/user-query.dto'

/**
 * UsersController - Phase 9
 *
 * Contrôleur Prisma pour la gestion des utilisateurs
 * Route: /users
 *
 * Endpoints:
 * - GET    /users                Liste utilisateurs
 * - GET    /users/stats          Statistiques utilisateurs
 * - GET    /users/:id            Détails utilisateur
 * - GET    /users/:id/settings   Paramètres utilisateur
 * - POST   /users                Créer utilisateur
 * - PUT    /users/:id            Mettre à jour utilisateur
 * - PUT    /users/:id/settings   Mettre à jour paramètres
 * - DELETE /users/:id            Supprimer utilisateur
 * - POST   /users/:id/activate   Activer utilisateur
 * - POST   /users/:id/deactivate Désactiver utilisateur
 */
@Controller('users')
@ApiTags('👤 Users (Prisma)')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersPrismaService: UsersPrismaService) {}

  /**
   * GET /users
   * Liste des utilisateurs
   */
  @Get()
  @ApiOperation({ summary: 'Liste des utilisateurs (Prisma)' })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  async findAll(@Query() query: UserQueryDto) {
    const users = await this.usersPrismaService.findAll(query)

    return {
      success: true,
      data: users,
      meta: {
        total: users.length,
        filters: query,
      },
    }
  }

  /**
   * GET /users/stats
   * Statistiques des utilisateurs
   */
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des utilisateurs (Prisma)' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStats() {
    const stats = await this.usersPrismaService.getStats()

    return {
      success: true,
      data: stats,
    }
  }

  /**
   * GET /users/:id
   * Récupérer un utilisateur par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Utilisateur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersPrismaService.findOne(id)

    return {
      success: true,
      data: user,
    }
  }

  /**
   * GET /users/:id/settings
   * Récupérer les paramètres d'un utilisateur
   */
  @Get(':id/settings')
  @ApiOperation({ summary: 'Récupérer les paramètres utilisateur (Prisma)' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserSettings(@Param('id') id: string) {
    const settings = await this.usersPrismaService.getUserSettings(id)

    return {
      success: true,
      data: settings,
    }
  }

  /**
   * POST /users
   * Créer un nouveau utilisateur
   */
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau utilisateur (Prisma)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email déjà existant' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersPrismaService.create(createUserDto)

    return {
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
      statusCode: 201,
    }
  }

  /**
   * PUT /users/:id
   * Mettre à jour un utilisateur
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (Prisma)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 409, description: 'Email déjà existant' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersPrismaService.update(id, updateUserDto)

    return {
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès',
    }
  }

  /**
   * PUT /users/:id/settings
   * Mettre à jour les paramètres d'un utilisateur
   */
  @Put(':id/settings')
  @ApiOperation({ summary: 'Mettre à jour les paramètres utilisateur (Prisma)' })
  @ApiBody({ type: UpdateUserSettingsDto })
  @ApiResponse({ status: 200, description: 'Paramètres mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async updateUserSettings(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserSettingsDto
  ) {
    const settings = await this.usersPrismaService.updateUserSettings(id, updateDto)

    return {
      success: true,
      data: settings,
      message: 'Paramètres mis à jour avec succès',
    }
  }

  /**
   * POST /users/:id/activate
   * Activer un utilisateur
   */
  @Post(':id/activate')
  @ApiOperation({ summary: 'Activer un utilisateur (Prisma)' })
  @ApiResponse({ status: 200, description: 'Utilisateur activé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async activate(@Param('id') id: string) {
    const user = await this.usersPrismaService.activate(id)

    return {
      success: true,
      data: user,
      message: 'Utilisateur activé avec succès',
    }
  }

  /**
   * POST /users/:id/deactivate
   * Désactiver un utilisateur
   */
  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un utilisateur (Prisma)' })
  @ApiResponse({ status: 200, description: 'Utilisateur désactivé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async deactivate(@Param('id') id: string) {
    const user = await this.usersPrismaService.deactivate(id)

    return {
      success: true,
      data: user,
      message: 'Utilisateur désactivé avec succès',
    }
  }

  /**
   * DELETE /users/:id
   * Supprimer un utilisateur
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur (Prisma)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async remove(@Param('id') id: string) {
    await this.usersPrismaService.remove(id)

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    }
  }
}
