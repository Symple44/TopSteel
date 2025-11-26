// FIXED: Using Prisma types instead of deleted TypeORM entities
import type { User } from '@prisma/client'

/**
 * Interface d'abstraction pour les opérations utilisateur
 * utilisées par le module d'authentification
 */
export interface IUserRepository {
  /**
   * Trouve un utilisateur par email ou acronyme
   */
  findByEmailOrAcronym(emailOrAcronym: string): Promise<User | null>

  /**
   * Trouve un utilisateur par ID
   */
  findById(id: string): Promise<User | null>

  /**
   * Met à jour les informations de dernière connexion
   */
  updateLastLogin(userId: string, lastLogin: Date): Promise<void>

  /**
   * Vérifie si un utilisateur existe par email
   */
  existsByEmail(email: string): Promise<boolean>

  /**
   * Vérifie si un utilisateur existe par acronyme
   */
  existsByAcronym(acronym: string): Promise<boolean>
}
