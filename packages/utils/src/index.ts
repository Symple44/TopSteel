// packages/utils/src/index.ts
export { cn } from './lib/cn';
export { formatDate, formatCurrency, formatNumber } from './lib/formatters';
export { debounce, throttle } from './lib/functions';
export { validateEmail, validatePhone, validateCNPJ } from './lib/validators';

// Export dos tipos utilitários
export type { DeepPartial, DeepRequired } from './types';

// Função de debug sécurisée
export function safeLog(...args: any[]) {
  if (typeof console !== 'undefined' && console.info) {
    console.info(...args);
  }
}

// Vérification de l'environnement
export function isBrowser() {
  return typeof globalThis !== 'undefined' && typeof globalThis.document !== 'undefined';
}

export function isNode() {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
}

