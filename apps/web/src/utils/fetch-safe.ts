// Safe fetch utility to handle the mysterious CLIENT error
import { getCachedApiUrl } from './ip-config'
import { diagnoseFetch } from './fetch-diagnostics'
import { tryBypassNextFetch } from './fetch-bypass'

let diagnosticRun = false

export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  // Si l'URL contient localhost, remplacer par l'URL auto-détectée
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('[::1]')) {
    try {
      const baseApiUrl = await getCachedApiUrl()
      // Remplacer la base de l'URL par l'URL auto-détectée
      const urlObj = new URL(url)
      const baseUrlObj = new URL(baseApiUrl)
      url = url.replace(`${urlObj.protocol}//${urlObj.host}`, baseApiUrl)
    } catch (error) {
      // Utilisation de l'URL originale en cas d'échec
    }
  }

  // Diagnostic une seule fois (mode silencieux)
  if (!diagnosticRun) {
    diagnoseFetch()
    diagnosticRun = true
  }

  // Essayons d'abord fetch standard, puis fallback si problème CLIENT
  try {
    const originalFetch = globalThis.fetch
    if (!originalFetch || typeof originalFetch !== 'function') {
      throw new Error('Fetch non disponible, utilisation du fallback HTTP')
    }
    
    return await originalFetch(url, options)
  } catch (error: any) {
    // Logs simplifiés - seulement en cas d'erreur CLIENT
    if (error?.message?.includes('CLIENT')) {
      
      // Essayer le bypass en premier
      try {
        return await tryBypassNextFetch(url, options)
      } catch (bypassError) {
        // Continuer vers le fallback HTTP
      }
    }
    
    // Si erreur CLIENT ou fetch corrompu, utiliser Node.js HTTP
    if (error?.message?.includes('CLIENT') || 
        error?.message?.includes('fetch') ||
        error?.name === 'TypeError') {
      
      try {
        const nodeUrl = new URL(url)
        const isHttps = nodeUrl.protocol === 'https:'
        const httpModule = isHttps ? await import('https') : await import('http')
        
        // Handle IPv6 addresses properly
        let hostname = nodeUrl.hostname
        if (hostname === '::1') {
          hostname = '::1'
        } else if (hostname.startsWith('[') && hostname.endsWith(']')) {
          // Remove brackets from IPv6 addresses for Node.js http module
          hostname = hostname.slice(1, -1)
        }
        
        return new Promise<Response>((resolve, reject) => {
          const requestOptions = {
            hostname: hostname,
            port: nodeUrl.port || (isHttps ? 443 : 80),
            path: nodeUrl.pathname + nodeUrl.search,
            method: options?.method || 'GET',
            headers: options?.headers || {},
            family: hostname.includes(':') ? 6 : 4, // Force IPv6 for IPv6 addresses
          }
          
          const req = httpModule.request(requestOptions, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
              const response = new Response(data, {
                status: res.statusCode || 200,
                statusText: res.statusMessage || 'OK',
                headers: new Headers(res.headers as any)
              })
              resolve(response)
            })
          })
          
          req.on('error', reject)
          
          if (options?.body) {
            req.write(options.body)
          }
          
          req.end()
        })
      } catch (httpError) {
        console.error('🔴 HTTP natif aussi échoué:', httpError)
        throw httpError
      }
    }
    
    // Re-lancer l'erreur si ce n'est pas un problème CLIENT
    throw error
  }
}