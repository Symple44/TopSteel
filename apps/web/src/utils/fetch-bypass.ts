// Tentative de bypass du fetch patché de Next.js pour résoudre l'erreur CLIENT
export async function tryBypassNextFetch(url: string, options?: RequestInit): Promise<Response> {
  // Stratégie 1: Utiliser le fetch original stocké dans _nextOriginalFetch
  const nextFetch = globalThis.fetch as any
  if (nextFetch?._nextOriginalFetch) {
    try {
      return await nextFetch._nextOriginalFetch(url, options)
    } catch (error) {
    }
  }

  // Stratégie 2: Accéder au fetch via une autre référence globale
  const altFetch = (global as any)?.fetch || (globalThis as any)?.originalFetch
  if (altFetch && altFetch !== globalThis.fetch) {
    try {
      return await altFetch(url, options)
    } catch (error) {
    }
  }

  // Stratégie 3: Créer un fetch clean avec une iframe
  try {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    
    const cleanFetch = iframe.contentWindow?.fetch
    document.body.removeChild(iframe)
    
    if (cleanFetch) {
      return await cleanFetch.call(window, url, options)
    }
  } catch (error) {
  }

  // Stratégie 4: XMLHttpRequest comme dernier recours
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options?.method || 'GET', url)
    
    // Headers
    if (options?.headers) {
      const headers = options.headers as Record<string, string>
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })
    }
    
    xhr.onload = () => {
      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers(xhr.getAllResponseHeaders()
          .split('\r\n')
          .filter(Boolean)
          .reduce((acc, header) => {
            const [key, value] = header.split(': ')
            if (key && value) acc[key] = value
            return acc
          }, {} as Record<string, string>))
      })
      resolve(response)
    }
    
    xhr.onerror = () => reject(new Error(`XHR failed: ${xhr.status}`))
    xhr.send(options?.body as string)
  })
}