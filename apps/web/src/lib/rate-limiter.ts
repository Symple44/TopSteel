/**
 * Rate Limiter pour les routes API Next.js
 *
 * Implémentation simple basée sur un Map en mémoire.
 * Pour la production à grande échelle, considérer Redis.
 */

import type { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  /** Nombre max de requêtes par fenêtre */
  maxRequests: number
  /** Durée de la fenêtre en millisecondes */
  windowMs: number
  /** Message d'erreur personnalisé */
  message?: string
  /** Fonction pour extraire l'identifiant (IP par défaut) */
  keyGenerator?: (request: NextRequest) => string
  /** Headers à inclure dans la réponse */
  headers?: boolean
  /** Fonction appelée quand la limite est atteinte */
  onLimitReached?: (key: string, request: NextRequest) => void
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

// Store en mémoire pour les entrées de rate limit
const rateLimitStore = new Map<string, RateLimitEntry>()

// Nettoyage périodique des entrées expirées
const CLEANUP_INTERVAL = 60000 // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)

  // Ne pas empêcher le process de se terminer
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

/**
 * Extrait l'adresse IP d'une requête Next.js
 */
function getClientIP(request: NextRequest): string {
  // Headers couramment utilisés par les proxies
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback
  return 'unknown'
}

/**
 * Crée un rate limiter avec la configuration spécifiée
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    message = 'Too many requests, please try again later.',
    keyGenerator = getClientIP,
    headers = true,
    onLimitReached,
  } = config

  // Démarrer le nettoyage si pas déjà actif
  startCleanup()

  return {
    /**
     * Vérifie si une requête doit être limitée
     */
    check(request: NextRequest): RateLimitResult {
      const key = keyGenerator(request)
      const now = Date.now()

      let entry = rateLimitStore.get(key)

      // Nouvelle entrée ou fenêtre expirée
      if (!entry || entry.resetTime <= now) {
        entry = {
          count: 1,
          resetTime: now + windowMs,
        }
        rateLimitStore.set(key, entry)

        return {
          success: true,
          remaining: maxRequests - 1,
          reset: entry.resetTime,
          limit: maxRequests,
        }
      }

      // Incrémenter le compteur
      entry.count++

      // Vérifier si la limite est atteinte
      if (entry.count > maxRequests) {
        if (onLimitReached) {
          onLimitReached(key, request)
        }

        return {
          success: false,
          remaining: 0,
          reset: entry.resetTime,
          limit: maxRequests,
        }
      }

      return {
        success: true,
        remaining: maxRequests - entry.count,
        reset: entry.resetTime,
        limit: maxRequests,
      }
    },

    /**
     * Génère les headers de rate limit
     */
    getHeaders(result: RateLimitResult): Record<string, string> {
      if (!headers) return {}

      return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      }
    },

    /**
     * Génère une réponse 429 Too Many Requests
     */
    limitResponse(result: RateLimitResult): Response {
      return new Response(
        JSON.stringify({
          success: false,
          error: message,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...this.getHeaders(result),
          },
        }
      )
    },

    /**
     * Reset le compteur pour une clé spécifique
     */
    reset(request: NextRequest): void {
      const key = keyGenerator(request)
      rateLimitStore.delete(key)
    },

    /**
     * Récupère les stats actuelles
     */
    getStats(): { totalKeys: number; keys: string[] } {
      return {
        totalKeys: rateLimitStore.size,
        keys: Array.from(rateLimitStore.keys()),
      }
    },
  }
}

// ============================================
// LIMITERS PRÉ-CONFIGURÉS
// ============================================

/**
 * Rate limiter standard pour les API (100 req/min)
 */
export const standardLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests. Please wait a moment.',
})

/**
 * Rate limiter strict pour l'authentification (5 req/min)
 */
export const authLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many authentication attempts. Please wait before trying again.',
  onLimitReached: (key) => {
    console.warn(`[RateLimit] Auth limit reached for: ${key}`)
  },
})

/**
 * Rate limiter pour les opérations sensibles (10 req/min)
 */
export const sensitiveLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests for this operation. Please try again later.',
})

/**
 * Rate limiter pour les uploads (20 req/min)
 */
export const uploadLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many uploads. Please wait before uploading more files.',
})

/**
 * Rate limiter pour la recherche (30 req/min)
 */
export const searchLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many search requests. Please slow down.',
})

// ============================================
// HELPER POUR LES ROUTES API
// ============================================

/**
 * Wrapper pour appliquer le rate limiting à une route API
 */
export function withRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const result = limiter.check(request)

    if (!result.success) {
      return limiter.limitResponse(result)
    }

    const response = await handler(request)

    // Ajouter les headers de rate limit à la réponse
    const rateLimitHeaders = limiter.getHeaders(result)
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value)
    }

    return response
  }
}

/**
 * Middleware pour le rate limiting basé sur le chemin
 */
export function getRateLimiterForPath(pathname: string): ReturnType<typeof createRateLimiter> {
  if (pathname.startsWith('/api/auth')) {
    return authLimiter
  }
  if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/images')) {
    return uploadLimiter
  }
  if (pathname.startsWith('/api/search')) {
    return searchLimiter
  }
  if (pathname.includes('/admin/') || pathname.includes('/sensitive/')) {
    return sensitiveLimiter
  }
  return standardLimiter
}
