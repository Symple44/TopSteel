/**
 * 👤 DOMAINE USER - EXPORTS PUBLICS
 * Point d'entrée pour le domaine utilisateur
 */

// ===== RE-EXPORTS UTILES =====
export type {
  Competence,
  // Entités principales
  User,
  UserPreferences,
  UserProfile,
  // Value Objects & Enums
  UserRole,
  UserSecurity,
  UserStats,
  UserStatut,
  UserWithActivity,
} from './domain/entities'
// ===== DOMAIN LAYER =====
export * from './domain/entities'
