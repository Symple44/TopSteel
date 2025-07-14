/**
 * 💰 DOMAINE QUOTES - EXPORTS PUBLICS
 * Point d'entrée pour le domaine devis
 */

// ===== DOMAIN LAYER =====
export * from './domain/entities'

// ===== RE-EXPORTS UTILES =====
export type {
  // Entités principales
  Quote,
  QuoteItem,
  QuoteTerms,
  QuoteTotals,
  QuoteStats,
  QuoteWithDetails,
  
  // Value Objects & Enums
  QuoteStatut,
  QuoteType,
} from './domain/entities'