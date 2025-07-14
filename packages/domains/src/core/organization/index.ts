/**
 * 🏢 DOMAINE ORGANIZATION - EXPORTS PUBLICS
 * Point d'entrée pour le domaine organisation
 */

// ===== DOMAIN LAYER =====
export * from './domain/entities'

// ===== RE-EXPORTS UTILES =====
export type {
  // Entités principales
  Organization,
  Departement,
  Site,
  OrganizationStats,
  
  // Value Objects & Enums
  DepartementType,
  SiteType,
  OrganizationAddress,
  OrganizationContact,
  LegalInfo,
} from './domain/entities'