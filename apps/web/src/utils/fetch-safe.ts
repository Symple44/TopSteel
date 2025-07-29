// Simplified fetch utility with undici fallback for Node.js
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    // In Node.js server environment, use undici directly to avoid Next.js fetch patching issues
    if (typeof window === 'undefined') {
      try {
        const { fetch: undiciFetch } = await import('undici')
        const response = await undiciFetch(url, options)
        
        // Log failed HTTP status for monitoring
        if (!response.ok) {
          console.warn(`HTTP ${response.status} ${response.statusText} - ${url}`)
        }
        
        return response
      } catch (undiciError) {
        console.warn('undici failed, trying globalThis.fetch fallback:', undiciError)
        
        // Fallback to globalThis.fetch if undici fails
        if (typeof globalThis.fetch === 'function') {
          try {
            const response = await globalThis.fetch(url, options)
            
            if (!response.ok) {
              console.warn(`HTTP ${response.status} ${response.statusText} - ${url}`)
            }
            
            return response
          } catch (fetchError) {
            console.error('Both undici and globalThis.fetch failed:', fetchError)
            throw fetchError
          }
        }
        
        throw undiciError
      }
    }
    
    // In browser environment, use globalThis.fetch
    if (typeof globalThis.fetch === 'function') {
      const response = await globalThis.fetch(url, options)
      
      // Log failed HTTP status for monitoring
      if (!response.ok) {
        console.warn(`HTTP ${response.status} ${response.statusText} - ${url}`)
      }
      
      return response
    }
    
    throw new Error('Fetch not available in this environment')
    
  } catch (error) {
    // Log network/fetch errors for monitoring
    console.error('Fetch failed:', {
      url,
      method: options?.method || 'GET',
      error: error instanceof Error ? error.message : String(error)
    })
    
    throw error
  }
}