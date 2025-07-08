/**
 * Utilitaires pour les entités
 */

export function generateEntityId(prefix: string, lastId?: number): string {
  const nextId = (lastId || 0) + 1
  return `${prefix}${nextId.toString().padStart(6, '0')}`
}

export function parseEntityId(entityId: string): { type: string; id: number } | null {
  const match = entityId.match(/^([A-Z]+)(\d+)$/)

  if (!match) {
    return null
  }

  const [, type, numericPart] = match

  if (!type || !numericPart) {
    return null
  }

  return {
    type: type.toUpperCase(),
    id: parseInt(numericPart, 10),
  }
}

export function formatEntityDisplay(type: string, id: number, name?: string): string {
  const prefix = `${type}${id.toString().padStart(6, '0')}`
  return name ? `${prefix} - ${name}` : prefix
}
