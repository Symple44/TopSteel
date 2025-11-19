import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../core/common/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/security/guards/roles.guard'
import { UserRole } from '../users/entities/user.entity'
import { NotificationPrismaService } from './prisma/notification-prisma.service'

/**
 * NotificationsController
 *
 * Contrôleur migré vers Prisma pour la gestion des notifications
 * Remplace progressivement NotificationsController (TypeORM)
 *
 * Routes:
 * - POST /notifications - Créer notification
 * - GET /notifications - Liste paginée
 * - GET /notifications/stats - Statistiques
 * - GET /notifications/:id - Notification par ID
 * - PATCH /notifications/:id - Mettre à jour
 * - DELETE /notifications/:id - Supprimer
 *
 * Note: Version simplifiée sans isArchived (champ manquant dans schéma Prisma)
 */
@Controller('notifications')
@ApiTags('🔔 Notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationPrismaService) {}

  /**
   * Créer une nouvelle notification
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Créer une nouvelle notification',
    description: 'Créer une notification via Prisma (admin/manager uniquement)',
  })
  @ApiResponse({ status: 201, description: 'Notification créée avec succès' })
  async create(
    @Body()
    createDto: {
      userId: string
      type: string
      title: string
      message: string
      category?: string
      priority?: string
      actionUrl?: string
      actionLabel?: string
      expiresAt?: string
    }
  ) {
    return this.notificationService.create({
      ...createDto,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : undefined,
    })
  }

  /**
   * Lister les notifications avec pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Lister les notifications avec pagination',
    description: 'Récupère les notifications via Prisma avec pagination et filtres',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche dans title/message' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filtrer par type' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ) {
    return this.notificationService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      type,
      sortBy,
      sortOrder,
    })
  }

  /**
   * Statistiques des notifications
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Statistiques des notifications',
    description: 'Statistiques globales via Prisma (total, read, unread, expired)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées',
    schema: {
      example: {
        total: 150,
        read: 80,
        unread: 70,
        expired: 10,
      },
    },
  })
  async getStats() {
    return this.notificationService.getStats()
  }

  /**
   * Récupérer une notification par ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une notification par ID',
    description: 'Récupère une notification spécifique via Prisma',
  })
  @ApiResponse({ status: 200, description: 'Notification trouvée' })
  @ApiResponse({ status: 404, description: 'Notification non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const notification = await this.notificationService.findOne(id)
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`)
    }
    return notification
  }

  /**
   * Mettre à jour une notification
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Mettre à jour une notification',
    description: 'Modifie une notification via Prisma (admin/manager uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Notification mise à jour' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    updateDto: {
      title?: string
      message?: string
      category?: string
      priority?: string
      actionUrl?: string
      actionLabel?: string
      expiresAt?: string
    }
  ) {
    return this.notificationService.update(id, {
      ...updateDto,
      expiresAt: updateDto.expiresAt ? new Date(updateDto.expiresAt) : undefined,
    })
  }

  /**
   * Supprimer une notification
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une notification',
    description: 'Supprime définitivement une notification via Prisma (pas de soft delete)',
  })
  @ApiResponse({ status: 204, description: 'Notification supprimée' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.remove(id)
  }
}
import { User } from '@prisma/client'
