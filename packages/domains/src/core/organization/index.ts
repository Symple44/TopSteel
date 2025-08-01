/**
 * 🏢 DOMAINE ORGANIZATION - EXPORTS PUBLICS
 * Point d'entrée pour le domaine organisation
 */

// ===== RE-EXPORTS UTILES =====
export type {
  Departement,
  // Value Objects & Enums
  DepartementType,
  LegalInfo,
  // Entités principales
  Organization,
  OrganizationAddress,
  OrganizationContact,
  OrganizationStats,
  Site,
  SiteType,
} from './domain/entities'
// ===== DOMAIN LAYER =====
export * from './domain/entities'
