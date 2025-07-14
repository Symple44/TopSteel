/**
 * 💼 DOMAINE SALES - EXPORTS PUBLICS
 * Contexte Commercial de l'ERP TopSteel
 */

// ===== SOUS-DOMAINES SALES =====
export * from './quotes'
// export * from './orders'     // À créer
// export * from './contracts'  // À créer

// ===== RE-EXPORTS PRINCIPAUX =====
export type {
  // Quotes
  Quote,
  QuoteStatut,
  QuoteType,
  QuoteItem,
  QuoteStats,
} from './quotes'