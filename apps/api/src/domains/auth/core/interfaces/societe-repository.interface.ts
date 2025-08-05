import type { Societe } from '../../../../features/societes/entities/societe.entity'
import type { SocieteUser } from '../../../../features/societes/entities/societe-user.entity'

/**
 * Interface d'abstraction pour les opérations société
 * utilisées par le module d'authentification
 */
export interface ISocieteRepository {
  /**
   * Trouve une société par ID
   */
  findById(id: string): Promise<Societe | null>

  /**
   * Trouve une société par code
   */
  findByCode(code: string): Promise<Societe | null>

  /**
   * Récupère toutes les sociétés actives
   */
  findActiveSocietes(): Promise<Societe[]>
}

/**
 * Interface d'abstraction pour les relations utilisateur-société
 */
export interface ISocieteUserRepository {
  /**
   * Trouve les relations société-utilisateur pour un utilisateur
   */
  findByUserId(userId: string): Promise<SocieteUser[]>

  /**
   * Trouve une relation spécifique utilisateur-société
   */
  findByUserAndSociete(userId: string, societeId: string): Promise<SocieteUser | null>

  /**
   * Vérifie si un utilisateur appartient à une société
   */
  userBelongsToSociete(userId: string, societeId: string): Promise<boolean>

  /**
   * Met à jour la société par défaut d'un utilisateur
   */
  updateDefaultSociete(userId: string, societeId: string): Promise<void>
}
