import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from '../auth.service'
import { Roles } from '../decorators/roles.decorator'
import { JwtAuthGuard } from '../security/guards/jwt-auth.guard'
import { RolesGuard } from '../security/guards/roles.guard'

/**
 * @deprecated This controller uses TypeORM and is kept for backward compatibility only.
 * Use SessionsController (Prisma-based) at /sessions/* endpoints instead.
 * This legacy controller will be removed in v3.0.0.
 *
 * Migration: Replace /auth/sessions-legacy/* with /sessions/* in your API calls.
 */
@Controller('auth/sessions-legacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsLegacyController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Obtenir toutes les sessions actives (Admin uniquement)
   */
  @Get('active')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getActiveSessions() {
    try {
      const sessions = await this.authService.getAllActiveSessions()
      return {
        success: true,
        data: sessions,
        total: sessions.length,
      }
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des sessions actives',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Obtenir l'historique des connexions avec pagination (Admin uniquement)
   */
  @Get('history')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getConnectionHistory(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ) {
    try {
      const { sessions, total } = await this.authService.getConnectionHistory(limit, offset)

      return {
        success: true,
        data: sessions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      }
    } catch {
      throw new HttpException(
        "Erreur lors de la récupération de l'historique",
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Obtenir l'historique d'un utilisateur spécifique (Admin uniquement)
   */
  @Get('user/:userId/history')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getUserConnectionHistory(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number
  ) {
    try {
      const sessions = await this.authService.getUserConnectionHistory(userId, limit)

      // Calculer des statistiques pour l'utilisateur
      const activeSessions = sessions.filter((s) => s.status === 'active').length
      const totalSessions = sessions.length
      const forcedLogouts = sessions.filter((s) => s.status === 'forced_logout').length

      const thisWeek = new Date()
      thisWeek.setDate(thisWeek.getDate() - 7)
      const sessionsThisWeek = sessions.filter((s) => s.loginTime >= thisWeek).length

      return {
        success: true,
        data: sessions,
        stats: {
          totalSessions,
          activeSessions,
          sessionsThisWeek,
          forcedLogouts,
          lastLogin: sessions[0]?.loginTime || null,
        },
      }
    } catch {
      throw new HttpException(
        "Erreur lors de la récupération de l'historique utilisateur",
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Forcer la déconnexion d'un utilisateur (Admin uniquement)
   */
  @Post('disconnect-user')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async forceLogoutUser(
    @Body() body: { userId: string; reason?: string },
    @Request() req: Express.Request
  ) {
    try {
      const { userId, reason = 'Déconnexion administrative' } = body
      const adminUserId =
        (req.user as { id?: string; sub?: string; email?: string })?.sub ||
        (req.user as { id?: string; sub?: string; email?: string })?.id

      if (!userId) {
        throw new HttpException('userId requis', HttpStatus.BAD_REQUEST)
      }

      const removedSessions = await this.authService.forceLogoutUser(
        userId,
        adminUserId || '',
        reason
      )

      return {
        success: true,
        message: `Utilisateur déconnecté avec succès`,
        data: {
          userId,
          removedSessions: removedSessions.length,
          adminUserId,
          reason,
        },
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la déconnexion forcée',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Forcer la déconnexion d'une session spécifique (Admin uniquement)
   */
  @Post('disconnect-session')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async forceLogoutSession(
    @Body() body: { sessionId: string; reason?: string },
    @Request() req: Express.Request
  ) {
    try {
      const { sessionId, reason = 'Déconnexion administrative' } = body
      const adminUserId =
        (req.user as { id?: string; sub?: string; email?: string })?.sub ||
        (req.user as { id?: string; sub?: string; email?: string })?.id

      if (!sessionId) {
        throw new HttpException('sessionId requis', HttpStatus.BAD_REQUEST)
      }

      const success = await this.authService.forceLogoutSession(
        sessionId,
        adminUserId || '',
        reason
      )

      if (!success) {
        throw new HttpException('Session non trouvée ou déjà déconnectée', HttpStatus.NOT_FOUND)
      }

      return {
        success: true,
        message: 'Session déconnectée avec succès',
        data: {
          sessionId,
          adminUserId,
          reason,
        },
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Erreur lors de la déconnexion de la session',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Obtenir les statistiques des sessions (Admin uniquement)
   */
  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getSessionStats() {
    try {
      const stats = await this.authService.getSessionStats()

      return {
        success: true,
        data: stats,
      }
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des statistiques',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Nettoyer les sessions expirées (Admin uniquement)
   */
  @Post('cleanup')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async cleanupExpiredSessions(@Request() _req: Express.Request) {
    try {
      const result = await this.authService.cleanupExpiredSessions()

      return {
        success: true,
        message: 'Nettoyage terminé avec succès',
        data: {
          redisCleanedCount: result.redisCleanedCount,
          databaseCleanedCount: result.databaseCleanedCount,
          totalCleaned: result.redisCleanedCount + result.databaseCleanedCount,
        },
      }
    } catch {
      throw new HttpException(
        'Erreur lors du nettoyage des sessions',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Mettre à jour l'activité de la session courante
   */
  @Post('heartbeat')
  async updateActivity(@Request() req: { user: { sessionId: string } }) {
    try {
      const sessionId = req.user.sessionId

      if (!sessionId) {
        throw new HttpException('Session ID manquant', HttpStatus.BAD_REQUEST)
      }

      await this.authService.updateSessionActivity(sessionId)

      return {
        success: true,
        message: 'Activité mise à jour',
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        "Erreur lors de la mise à jour d'activité",
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Obtenir les sessions de l'utilisateur connecté
   */
  @Get('my-sessions')
  async getMyActiveSessions(@Request() req: { user: { sub: string } }) {
    try {
      const userId = req.user.sub
      const sessions = await this.authService.getUserConnectionHistory(userId, 10)

      return {
        success: true,
        data: sessions.filter((s) => s.status === 'active'),
        total: sessions.filter((s) => s.status === 'active').length,
      }
    } catch {
      throw new HttpException(
        'Erreur lors de la récupération des sessions',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
