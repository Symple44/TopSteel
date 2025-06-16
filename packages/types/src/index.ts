// packages/types/src/index.ts
// Common types
export * from './common'
export * from './user'
export * from './client'
export * from './projet'
export * from './stock'
export * from './devis'
export * from './production'
export * from './api'
export * from './forms'
export * from './dashboard'

// Type guards
export function isProjet(obj: any): obj is Projet {
  return obj && typeof obj.reference === 'string' && obj.statut in ProjetStatut
}

export function isClient(obj: any): obj is Client {
  return obj && typeof obj.nom === 'string' && obj.type in ClientType
}

export function isStock(obj: any): obj is Stock {
  return obj && typeof obj.reference === 'string' && obj.type in StockType
}