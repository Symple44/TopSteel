/**
 * 👤 DOMAINE USER - EXPORTS PUBLICS
 * Point d'entrée pour le domaine utilisateur
 */

// ===== DOMAIN LAYER =====
export * from './domain/entities'

// ===== RE-EXPORTS UTILES =====
export type {
  // Entités principales
  User,
  UserProfile,
  UserPreferences,
  UserSecurity,
  UserStats,
  UserWithActivity,
  
  // Value Objects & Enums
  UserRole,
  UserStatut,
  Competence,
} from './domain/entities'