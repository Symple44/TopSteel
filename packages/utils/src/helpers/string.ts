// packages/utils/src/helpers/string.ts
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function truncate(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text
  return text.substring(0, length - suffix.length) + suffix
}

export function generateReference(prefix: string, number: number, length: number = 6): string {
  return `${prefix}${number.toString().padStart(length, '0')}`
}

export function parseReference(reference: string): { prefix: string; number: number } {
  const match = reference.match(/^([A-Z]+)-(\d+)$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error('Format de référence invalide');
  }
  return {
    prefix: match[1],
    number: parseInt(match[2], 10)
  };
}
}
