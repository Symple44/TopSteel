import {
  Controller,
  Get,
  Post,
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
import { SessionPrismaService } from './prisma/session-prisma.service'
import { CombinedSecurityGuard } from './security/guards/combined-security.guard'
import { Prisma } from '@prisma/client'

// DTOs
interface CreateSessionDto {
  userId: string
  sessionId: string
  accessToken: string
  refreshToken?: string
  ipAddress?: string
  userAgent?: string
  deviceInfo?: Prisma.InputJsonValue
  location?: Prisma.InputJsonValue
  metadata?: Prisma.InputJsonValue
}

interface ForceLogoutDto {
  forcedBy: string
  reason: string
}

interface SessionQueryDto {
  activeOnly?: boolean
}

/**
 * SessionsController - Phase 7.3
 *
 * Contrôleur Prisma pour la gestion des sessions utilisateur
 * Route: /sessions
 *
 * Endpoints:
 * - GET    /sessions/stats                  Statistiques sessions
 * - GET    /sessions/:id                    Détails session
 * - POST   /sessions                        Créer session
 * - DELETE /sessions/:id                    Logout session
 * - POST   /sessions/:id/force-logout       Forcer logout
 * - GET    /sessions/user/:userId           Sessions d'un utilisateur
 * - DELETE /sessions/user/:userId/revoke-all Révoquer toutes les sessions
 * - GET    /sessions/user/:userId/count     Compter sessions actives
 * - POST   /sessions/cleanup/expired        Nettoyer sessions expirées
 * - POST   /sessions/cleanup/idle           Marquer sessions idle
 */
@Controller('sessions')
@ApiTags('🔑 Sessions')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class SessionsController {
  constructor(private readonly sessionPrismaService: SessionPrismaService) {}

  /**
   * GET /sessions/stats
   * Statistiques des sessions
   */
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des sessions (Prisma)' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStats() {
    const stats = await this.sessionPrismaService.getStats()

    return {
      success: true,
      data: stats,
    }
  }

  /**
   * GET /sessions/:id
   * Récupérer une session par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une session par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Session récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async findOne(@Param('id') id: string) {
    const session = await this.sessionPrismaService.findSessionById(id, true)

    if (!session) {
      return {
        success: false,
        message: 'Session non trouvée',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: session,
    }
  }

  /**
   * POST /sessions
   * Créer une nouvelle session
   */
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle session (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        sessionId: { type: 'string' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' },
        deviceInfo: { type: 'object' },
        location: { type: 'object' },
        metadata: { type: 'object' },
      },
      required: ['userId', 'sessionId', 'accessToken'],
    },
  })
  @ApiResponse({ status: 201, description: 'Session créée avec succès' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSessionDto: CreateSessionDto) {
    const session = await this.sessionPrismaService.createSession(createSessionDto)

    return {
      success: true,
      data: session,
      message: 'Session créée avec succès',
      statusCode: 201,
    }
  }

  /**
   * DELETE /sessions/:sessionId
   * Déconnecter une session (logout)
   */
  @Delete(':sessionId')
  @ApiOperation({ summary: 'Déconnecter une session - logout (Prisma)' })
  @ApiResponse({ status: 200, description: 'Session déconnectée avec succès' })
  @ApiResponse({ status: 404, description: 'Session non trouvée' })
  async logout(@Param('sessionId') sessionId: string) {
    const session = await this.sessionPrismaService.logout(sessionId)

    return {
      success: true,
      data: session,
      message: 'Session déconnectée avec succès',
    }
  }

  /**
   * POST /sessions/:sessionId/force-logout
   * Forcer la déconnexion d'une session par un admin
   */
  @Post(':sessionId/force-logout')
  @ApiOperation({ summary: 'Forcer la déconnexion d\'une session (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        forcedBy: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['forcedBy', 'reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Session déconnectée de force avec succès' })
  async forceLogout(
    @Param('sessionId') sessionId: string,
    @Body() body: ForceLogoutDto
  ) {
    const session = await this.sessionPrismaService.forceLogout(
      sessionId,
      body.forcedBy,
      body.reason
    )

    return {
      success: true,
      data: session,
      message: 'Session déconnectée de force avec succès',
    }
  }

  /**
   * GET /sessions/user/:userId
   * Récupérer toutes les sessions d'un utilisateur
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer les sessions d\'un utilisateur (Prisma)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Sessions récupérées avec succès' })
  async findUserSessions(
    @Param('userId') userId: string,
    @Query() query: SessionQueryDto
  ) {
    const sessions = await this.sessionPrismaService.findUserSessions(
      userId,
      query.activeOnly !== false // Default to true
    )

    return {
      success: true,
      data: sessions,
      meta: {
        total: sessions.length,
        userId,
        activeOnly: query.activeOnly !== false,
      },
    }
  }

  /**
   * DELETE /sessions/user/:userId/revoke-all
   * Révoquer toutes les sessions d'un utilisateur
   */
  @Delete('user/:userId/revoke-all')
  @ApiOperation({ summary: 'Révoquer toutes les sessions d\'un utilisateur (Prisma)' })
  @ApiQuery({ name: 'exceptSessionId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Sessions révoquées avec succès' })
  async revokeAllUserSessions(
    @Param('userId') userId: string,
    @Query('exceptSessionId') exceptSessionId?: string
  ) {
    const count = await this.sessionPrismaService.revokeAllUserSessions(
      userId,
      exceptSessionId
    )

    return {
      success: true,
      data: {
        userId,
        revokedCount: count,
      },
      message: `${count} session(s) révoquée(s) avec succès`,
    }
  }

  /**
   * GET /sessions/user/:userId/count
   * Compter les sessions actives d'un utilisateur
   */
  @Get('user/:userId/count')
  @ApiOperation({ summary: 'Compter les sessions actives d\'un utilisateur (Prisma)' })
  @ApiResponse({ status: 200, description: 'Nombre de sessions actives récupéré avec succès' })
  async countActiveSessions(@Param('userId') userId: string) {
    const count = await this.sessionPrismaService.countActiveSessions(userId)

    return {
      success: true,
      data: {
        userId,
        activeSessionCount: count,
      },
    }
  }

  /**
   * POST /sessions/cleanup/expired
   * Nettoyer les sessions expirées
   */
  @Post('cleanup/expired')
  @ApiOperation({ summary: 'Nettoyer les sessions expirées (Prisma)' })
  @ApiResponse({ status: 200, description: 'Nettoyage effectué avec succès' })
  async cleanupExpired() {
    const count = await this.sessionPrismaService.cleanupExpiredSessions()

    return {
      success: true,
      data: {
        cleanedCount: count,
      },
      message: `${count} session(s) expirée(s) nettoyée(s) avec succès`,
    }
  }

  /**
   * POST /sessions/cleanup/idle
   * Marquer les sessions inactives comme idle
   */
  @Post('cleanup/idle')
  @ApiOperation({ summary: 'Marquer les sessions inactives comme idle (Prisma)' })
  @ApiResponse({ status: 200, description: 'Sessions idle marquées avec succès' })
  async markIdle() {
    const count = await this.sessionPrismaService.markIdleSessions()

    return {
      success: true,
      data: {
        markedCount: count,
      },
      message: `${count} session(s) marquée(s) comme idle avec succès`,
    }
  }
}
