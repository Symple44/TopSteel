/**
 * Utilitaires de sécurité pour l'application TopSteel ERP
 */

/**
 * Nettoie et valide une requête de recherche
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }

  // Supprimer les caractères potentiellement dangereux
  return query
    .replace(/[<>"']/g, '') // Supprimer les caractères XSS
    .replace(/[;()=]/g, '') // Supprimer les caractères d'injection SQL
    .trim()
    .slice(0, 100) // Limiter la longueur
}

/**
 * Valide qu'un UUID a le bon format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Valide qu'un tenant ID est sécurisé
 */
export function validateTenantId(tenantId: unknown): string | null {
  if (!tenantId || typeof tenantId !== 'string') {
    return null
  }

  if (!isValidUUID(tenantId)) {
    return null
  }

  return tenantId
}

/**
 * Nettoie les logs en supprimant les données sensibles
 */
export function sanitizeLogData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveKeys = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'cookie',
    'session',
  ]

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData)
  }

  const sanitized = { ...(data as Record<string, unknown>) }

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key])
    }
  }

  return sanitized
}

/**
 * Valide les paramètres d'entrée des API
 */
export function validateApiInput<T>(
  input: unknown,
  validator: (input: unknown) => input is T
): T | null {
  try {
    if (validator(input)) {
      return input
    }
    return null
  } catch {
    return null
  }
}

/**
 * Nettoie et valide un input utilisateur générique
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/[<>"'&]/g, '') // Caractères XSS
    .replace(/[;()=]/g, '') // Caractères d'injection SQL  
    .trim()
    .slice(0, 1000) // Limiter la longueur
}

/**
 * Échappe le contenu HTML pour éviter les attaques XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
