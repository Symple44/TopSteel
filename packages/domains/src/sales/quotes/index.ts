/**
 * 💰 DOMAINE QUOTES - EXPORTS PUBLICS
 * Point d'entrée pour le domaine devis
 */

// ===== RE-EXPORTS UTILES =====
export type {
  // Entités principales
  Quote,
  QuoteItem,
  QuoteStats,
  // Value Objects & Enums
  QuoteStatut,
  QuoteTerms,
  QuoteTotals,
  QuoteType,
  QuoteWithDetails,
} from './domain/entities'
// ===== DOMAIN LAYER =====
export * from './domain/entities'
