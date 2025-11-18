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
import { UserPrismaService } from './user-prisma.service'
import { CombinedSecurityGuard } from '../../auth/security/guards/combined-security.guard'
import { Prisma } from '@prisma/client'

// DTOs
interface CreateUserDto {
  email: string
  password: string
  username: string
  firstName?: string
  lastName?: string
  isActive?: boolean
}

interface UpdateUserDto {
  email?: string
  password?: string
  username?: string
  firstName?: string
  lastName?: string
  isActive?: boolean
}

interface UpdateUserSettingsDto {
  profile?: Prisma.InputJsonValue
  company?: Prisma.InputJsonValue
  preferences?: Prisma.InputJsonValue
}

interface UserQueryDto {
  page?: number
  limit?: number
  includeDeleted?: boolean
}

/**
 * UsersPrismaController - Phase 7.1
 *
 * Contrôleur Prisma pour la gestion des utilisateurs
 * Route: /users-prisma
 *
 * Endpoints:
 * - GET    /users-prisma          Liste utilisateurs (pagination)
 * - GET    /users-prisma/stats    Statistiques utilisateurs
 * - GET    /users-prisma/:id      Détails utilisateur
 * - POST   /users-prisma          Créer utilisateur
 * - PUT    /users-prisma/:id      Mettre à jour utilisateur
 * - DELETE /users-prisma/:id      Supprimer utilisateur (soft)
 * - GET    /users-prisma/:id/settings    Récupérer settings
 * - PUT    /users-prisma/:id/settings    Mettre à jour settings
 */
@Controller('users-prisma')
@ApiTags('👥 Users (Prisma)')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class UsersPrismaController {
  constructor(private readonly userPrismaService: UserPrismaService) {}

  /**
   * GET /users-prisma
   * Liste des utilisateurs avec pagination
   */
  @Get()
  @ApiOperation({ summary: 'Liste des utilisateurs avec pagination (Prisma)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  async findAll(@Query() query: UserQueryDto) {
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const result = await this.userPrismaService.findAll({
      skip,
      take: limit,
      includeDeleted: query.includeDeleted || false,
    })

    return {
      success: true,
      data: result.users,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    }
  }

  /**
   * GET /users-prisma/stats
   * Statistiques des utilisateurs
   */
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des utilisateurs (Prisma)' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStats() {
    const stats = await this.userPrismaService.getStats()

    return {
      success: true,
      data: stats,
    }
  }

  /**
   * GET /users-prisma/:id
   * Récupérer un utilisateur par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Utilisateur récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id') id: string) {
    const user = await this.userPrismaService.findOne(id, true)

    if (!user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
        statusCode: 404,
      }
    }

    // Exclure passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user as any

    return {
      success: true,
      data: userWithoutPassword,
    }
  }

  /**
   * POST /users-prisma
   * Créer un nouvel utilisateur
   */
  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['email', 'password', 'username'],
    },
  })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email ou username déjà existant' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userPrismaService.create(createUserDto)

    return {
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
      statusCode: 201,
    }
  }

  /**
   * PUT /users-prisma/:id
   * Mettre à jour un utilisateur
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userPrismaService.update(id, updateUserDto)

    return {
      success: true,
      data: user,
      message: 'Utilisateur mis à jour avec succès',
    }
  }

  /**
   * DELETE /users-prisma/:id
   * Supprimer un utilisateur (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur - soft delete (Prisma)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async remove(@Param('id') id: string) {
    await this.userPrismaService.remove(id)

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    }
  }

  /**
   * GET /users-prisma/:id/settings
   * Récupérer les paramètres d'un utilisateur
   */
  @Get(':id/settings')
  @ApiOperation({ summary: 'Récupérer les paramètres utilisateur (Prisma)' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés avec succès' })
  async getUserSettings(@Param('id') id: string) {
    const settings = await this.userPrismaService.getUserSettings(id)

    return {
      success: true,
      data: settings,
    }
  }

  /**
   * PUT /users-prisma/:id/settings
   * Mettre à jour les paramètres d'un utilisateur
   */
  @Put(':id/settings')
  @ApiOperation({ summary: 'Mettre à jour les paramètres utilisateur (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profile: { type: 'object' },
        company: { type: 'object' },
        preferences: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Paramètres mis à jour avec succès' })
  async updateUserSettings(
    @Param('id') id: string,
    @Body() updateSettingsDto: UpdateUserSettingsDto
  ) {
    const settings = await this.userPrismaService.updateUserSettings(id, updateSettingsDto)

    return {
      success: true,
      data: settings,
      message: 'Paramètres mis à jour avec succès',
    }
  }
}
