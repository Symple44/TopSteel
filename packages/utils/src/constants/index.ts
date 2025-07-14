/**
 * 📊 CONSTANTES - PACKAGE @erp/utils
 * Constantes métier pour l'ERP TopSteel
 */

// ===== METALLURGY CONSTANTS =====
export * from './metallurgy'

// ===== BUSINESS CONSTANTS =====

export const BUSINESS_CONSTANTS = {
  VAT_RATES: {
    STANDARD: 0.20,
    REDUCED: 0.10,
    SUPER_REDUCED: 0.055,
    ZERO: 0,
  },
  
  PAYMENT_TERMS: {
    IMMEDIATE: 0,
    NET_30: 30,
    NET_60: 60,
    NET_90: 90,
  },
  
  CURRENCY: {
    DEFAULT: 'EUR',
    SYMBOL: '€',
    DECIMAL_PLACES: 2,
  },
  
  QUOTE_VALIDITY: {
    STANDARD: 30, // jours
    EXPRESS: 7,
    CUSTOM: 60,
  },
  
  PROJECT_PHASES: {
    STUDY: 'ETUDE',
    DESIGN: 'CONCEPTION',
    PRODUCTION: 'PRODUCTION',
    DELIVERY: 'LIVRAISON',
    COMPLETED: 'TERMINE',
  },
  
  QUALITY_STANDARDS: {
    ISO_9001: 'ISO 9001',
    EN_1090: 'EN 1090',
    CE_MARKING: 'Marquage CE',
  },
  
  STOCK_THRESHOLDS: {
    CRITICAL: 5,
    LOW: 10,
    MEDIUM: 50,
    HIGH: 100,
  },
} as const

export const UI_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  
  DEBOUNCE_DELAY: {
    SEARCH: 300,
    AUTO_SAVE: 1000,
    VALIDATION: 500,
  },
  
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    CAD_FILE: 50 * 1024 * 1024, // 50MB
  },
} as const