import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'

@Injectable()
export class SessionInvalidationService implements OnModuleInit {
  private readonly logger = new Logger(SessionInvalidationService.name)

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Désactivé temporairement - problème avec l'ordre d'initialisation TypeORM
    // setTimeout(async () => {
    //   await this.invalidateAllSessions()
    // }, 2000)
    this.logger.log('SessionInvalidationService initialisé (invalidation automatique désactivée)')
  }

  /**
   * Invalide toutes les sessions actives en supprimant les refresh tokens
   */
  async invalidateAllSessions(): Promise<void> {
    try {
      const startTime = Date.now()

      // Mettre à jour tous les refresh tokens à null via Prisma
      const result = await this.prisma.user.updateMany({
        where: {
          refreshToken: {
            not: null,
          },
        },
        data: {
          refreshToken: null,
        },
      })

      const duration = Date.now() - startTime

      this.logger.log(
        `Sessions invalidées au redémarrage: ${result.count} utilisateurs (${duration}ms)`
      )
    } catch (error) {
      this.logger.error("Erreur lors de l'invalidation des sessions:", error)
    }
  }

  /**
   * Invalide la session d'un utilisateur spécifique
   */
  async invalidateUserSession(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      })
      this.logger.log(`Session invalidée pour l'utilisateur: ${userId}`)
    } catch (error) {
      this.logger.error(`Erreur lors de l'invalidation de la session pour ${userId}:`, error)
    }
  }

  /**
   * Invalide toutes les sessions manuellement (utile pour la maintenance)
   */
  async forceInvalidateAllSessions(): Promise<number> {
    try {
      const result = await this.prisma.user.updateMany({
        where: {
          refreshToken: {
            not: null,
          },
        },
        data: {
          refreshToken: null,
        },
      })

      this.logger.warn(
        `Invalidation forcée de toutes les sessions: ${result.count} utilisateurs`
      )
      return result.count
    } catch (error) {
      this.logger.error("Erreur lors de l'invalidation forcée:", error)
      throw error
    }
  }
}

