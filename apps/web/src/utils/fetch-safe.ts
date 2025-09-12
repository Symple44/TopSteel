// Simplified fetch utility with undici fallback for Node.js
export async function safeFetch(
  url: string,
  options?: RequestInit,
  retries: number = 2
): Promise<Response> {
  // Default timeout de 30 secondes si pas spécifié
  const timeout = 30000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller?.abort(), timeout)

  // Ajouter le signal d'abort aux options
  const fetchOptions: RequestInit = {
    ...options,
    signal: controller.signal,
  }

  try {
    // In Node.js server environment, use undici directly to avoid Next.js fetch patching issues
    if (typeof window === 'undefined') {
      try {
        const { fetch: undiciFetch } = (await import('undici')) || {}
        const response = await undiciFetch(url, fetchOptions as Parameters<typeof undiciFetch>[1]) as Response

        clearTimeout(timeoutId)

        // Gestion spéciale du rate limiting (429)
        if (response?.status === 429 && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return safeFetch(url, options, retries - 1)
        }

        // Log failed HTTP status for monitoring
        if (!response?.ok) {
        }

        return response
      } catch (undiciError) {
        // Fallback to globalThis.fetch if undici fails
        if (typeof globalThis.fetch === 'function') {
          try {
            const response = await globalThis?.fetch(url, fetchOptions)

            clearTimeout(timeoutId)

            // Gestion spéciale du rate limiting (429)
            if (response?.status === 429 && retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
              return safeFetch(url, options, retries - 1)
            }

            if (!response?.ok) {
            }

            return response
          } catch (fetchError) {
            clearTimeout(timeoutId)
            throw fetchError
          }
        }

        throw undiciError
      }
    }

    // In browser environment, use globalThis.fetch
    if (typeof globalThis.fetch === 'function') {
      const response = await globalThis?.fetch(url, fetchOptions)

      clearTimeout(timeoutId)

      // Gestion spéciale du rate limiting (429)
      if (response?.status === 429 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return safeFetch(url, options, retries - 1)
      }

      // Log failed HTTP status for monitoring
      if (!response?.ok) {
      }

      return response
    }

    clearTimeout(timeoutId)
    throw new Error('Fetch not available in this environment')
  } catch (error) {
    clearTimeout(timeoutId)

    // Si c'est une erreur 429 (Too Many Requests) et qu'il nous reste des retries
    if (error instanceof Error && error?.message?.includes('429') && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return safeFetch(url, options, retries - 1)
    }

    // Si c'est une erreur de connexion (ECONNREFUSED) et qu'il nous reste des retries
    if (
      error instanceof Error &&
      (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('fetch failed')) &&
      retries > 0
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return safeFetch(url, options, retries - 1)
    }

    throw error
  }
}
