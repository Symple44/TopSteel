/**
 * 🛠️ UTILITAIRES D'AIDE - PACKAGE @erp/utils
 * Fonctions utilitaires pour la manipulation de données
 */

// ===== ARRAY UTILITIES =====
export {
  groupBy,
  groupByMap,
  groupByPartial,
  sortBy,
  filterBy,
  chunk,
  unique,
  uniqueBy,
  uniqueByMap,
  groupByMultiple,
  partition,
} from './array'

// ===== STRING UTILITIES =====
export {
  capitalize,
  slugify,
  truncate,
  formatInitials,
  removeAccents,
  validateEmail,
  validatePhone,
  formatFileSize,
  generateReference,
  sanitizeFilename,
} from './string'