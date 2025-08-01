/**
 * 🛠️ UTILITAIRES D'AIDE - PACKAGE @erp/utils
 * Fonctions utilitaires pour la manipulation de données
 */

// ===== ARRAY UTILITIES =====
export {
  chunk,
  filterBy,
  groupBy,
  groupByMap,
  groupByMultiple,
  groupByPartial,
  partition,
  sortBy,
  unique,
  uniqueBy,
  uniqueByMap,
} from './array'

// ===== STRING UTILITIES =====
export {
  capitalize,
  formatFileSize,
  formatInitials,
  generateReference,
  removeAccents,
  sanitizeFilename,
  slugify,
  truncate,
  validateEmail,
  validatePhone,
} from './string'
