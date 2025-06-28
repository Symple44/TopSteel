// packages/utils/src/index.ts
export { cn } from './lib/cn';
export { formatDate, formatCurrency, formatNumber } from './lib/formatters';
export { debounce, throttle } from './lib/functions';
export { validateEmail, validatePhone, validateCNPJ } from './lib/validators';

// Export dos tipos utilitários
export type { DeepPartial, DeepRequired } from './types';

// Função de debug sécurisée
export function safeLog(...args: unknown[]) {
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
// Fonctions utilitaires manquantes (non dupliquées)
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export function getDaysUntil(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
