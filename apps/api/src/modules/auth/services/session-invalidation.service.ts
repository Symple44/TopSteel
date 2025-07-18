import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Not, IsNull } from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Injectable()
export class SessionInvalidationService implements OnModuleInit {
  private readonly logger = new Logger(SessionInvalidationService.name)

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

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
      // Vérifier que le repository est prêt
      if (!this.userRepository || !this.userRepository.metadata) {
        this.logger.warn('Repository non initialisé, saut de l\'invalidation des sessions')
        return
      }

      const startTime = Date.now()
      
      // Mettre à jour tous les refresh tokens à null
      const result = await this.userRepository.update(
        { refreshToken: Not(IsNull()) },
        { refreshToken: undefined }
      )
      
      const duration = Date.now() - startTime
      
      this.logger.log(`Sessions invalidées au redémarrage: ${result.affected} utilisateurs (${duration}ms)`)
    } catch (error) {
      this.logger.error('Erreur lors de l\'invalidation des sessions:', error)
    }
  }

  /**
   * Invalide la session d'un utilisateur spécifique
   */
  async invalidateUserSession(userId: string): Promise<void> {
    try {
      await this.userRepository.update(userId, { refreshToken: undefined })
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
      const result = await this.userRepository.update(
        { refreshToken: Not(IsNull()) },
        { refreshToken: undefined }
      )
      
      this.logger.warn(`Invalidation forcée de toutes les sessions: ${result.affected} utilisateurs`)
      return result.affected || 0
    } catch (error) {
      this.logger.error('Erreur lors de l\'invalidation forcée:', error)
      throw error
    }
  }
}