import { headers } from 'next/headers'

/**
 * Get the CSP nonce from headers (Server Components)
 */
export function getCSPNonce(): string | undefined {
  try {
    const headersList = headers()

    const resolvedHeaders = headersList instanceof Promise ? null : headersList
    return resolvedHeaders?.get('X-CSP-Nonce') || resolvedHeaders?.get('X-Nonce') || undefined
  } catch (_error) {
    // In client components or non-server contexts, headers() will throw
    return undefined
  }
}

/**
 * Get the CSP nonce from middleware headers (Client-side)
 */
export function getCSPNonceFromResponse(response: Response): string | undefined {
  return response?.headers?.get('X-CSP-Nonce') || response?.headers?.get('X-Nonce') || undefined
}

/**
 * Create nonce attributes for inline scripts/styles
 */
export function createNonceAttributes(nonce?: string): { nonce?: string } {
  return nonce ? { nonce } : {}
}

/**
 * Hook for client-side nonce access
 */
export function useCSPNonce(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  // Try to get nonce from document (if set by middleware)
  const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')
  if (metaNonce) {
    return metaNonce
  }

  // Fallback: try to extract from existing script tags
  const scripts = document.querySelectorAll('script[nonce]')
  if (scripts?.length > 0) {
    return scripts?.[0]?.getAttribute('nonce') || undefined
  }

  return undefined
}

/**
 * Generate CSP nonce (client-side fallback)
 * Note: This should only be used as a fallback. Server-generated nonces are preferred.
 */
export function generateClientNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto?.getRandomValues(array)
    return btoa(String?.fromCharCode?.apply(null, Array.from(array)))
  }

  // Fallback for older browsers
  return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36))
}
