/**
 * Status Tokens - TopSteel Design System
 * Couleurs des 13 statuts métier identifiés
 */

/**
 * Statuts Projets
 */
export const projectStatus = {
  EN_COURS: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    text: 'text-info',
    border: 'border-blue-200',
    hsl: '217 91% 60%',
  },
  TERMINE: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    text: 'text-success',
    border: 'border-green-200',
    hsl: '142 76% 36%',
  },
  ANNULE: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    hsl: '0 84% 60%',
  },
  BROUILLON: {
    bg: 'bg-gray-400',
    bgLight: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    hsl: '220 9% 46%',
  },
} as const

/**
 * Statuts Devis
 */
export const quoteStatus = {
  EN_ATTENTE: {
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    hsl: '45 93% 47%',
  },
  ACCEPTE: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    text: 'text-success',
    border: 'border-green-200',
    hsl: '142 76% 36%',
  },
  REFUSE: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    hsl: '0 84% 60%',
  },
} as const

/**
 * Statuts Production
 */
export const productionStatus = {
  PLANIFIE: {
    bg: 'bg-indigo-500',
    bgLight: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    hsl: '231 48% 48%',
  },
  EN_PRODUCTION: {
    bg: 'bg-orange-500',
    bgLight: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    hsl: '25 95% 53%',
  },
  CONTROLE_QUALITE: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hsl: '271 91% 65%',
  },
} as const

/**
 * Statuts Stock
 */
export const stockStatus = {
  EN_STOCK: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    hsl: '160 84% 39%',
  },
  RUPTURE: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    hsl: '0 84% 60%',
  },
  STOCK_FAIBLE: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hsl: '38 92% 50%',
  },
} as const

/**
 * Tous les statuts regroupés
 */
export const statusTokens = {
  project: projectStatus,
  quote: quoteStatus,
  production: productionStatus,
  stock: stockStatus,
} as const

/**
 * Mapping des statuts par clé (pour lookup rapide)
 */
export const statusByKey = {
  // Projets
  EN_COURS: projectStatus.EN_COURS,
  TERMINE: projectStatus.TERMINE,
  ANNULE: projectStatus.ANNULE,
  BROUILLON: projectStatus.BROUILLON,
  // Devis
  EN_ATTENTE: quoteStatus.EN_ATTENTE,
  ACCEPTE: quoteStatus.ACCEPTE,
  REFUSE: quoteStatus.REFUSE,
  // Production
  PLANIFIE: productionStatus.PLANIFIE,
  EN_PRODUCTION: productionStatus.EN_PRODUCTION,
  CONTROLE_QUALITE: productionStatus.CONTROLE_QUALITE,
  // Stock
  EN_STOCK: stockStatus.EN_STOCK,
  RUPTURE: stockStatus.RUPTURE,
  STOCK_FAIBLE: stockStatus.STOCK_FAIBLE,
} as const

export type StatusKey = keyof typeof statusByKey
export type ProjectStatus = typeof projectStatus
export type QuoteStatus = typeof quoteStatus
export type ProductionStatus = typeof productionStatus
export type StockStatus = typeof stockStatus
