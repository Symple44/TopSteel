// Utilitaire pour diagnostiquer et réparer le fetch corrompu de Next.js

export function diagnoseFetchCorruption() {
  const fetch = globalThis.fetch as any
  
  console.log('- Fetch type:', typeof fetch)
  console.log('- Fetch name:', fetch?.name)
  console.log('- Est patché Next.js:', '__nextPatched' in fetch)
  console.log('- A fetch original:', '_nextOriginalFetch' in fetch)
  console.log('- Propriétés:', Object.getOwnPropertyNames(fetch))
  
  // Tenter de voir le contenu du fetch original
  if (fetch._nextOriginalFetch) {
    console.log('- Fetch original type:', typeof fetch._nextOriginalFetch)
    console.log('- Fetch original name:', fetch._nextOriginalFetch.name)
    console.log('- Fetch original propriétés:', Object.getOwnPropertyNames(fetch._nextOriginalFetch))
  }
  
  // Analyser la corruption potentielle
  try {
    const fetchSource = fetch.toString()
    if (fetchSource.includes('CLIENT')) {
    }
  } catch (e) {
  }
}

export function attemptFetchRepair() {
  
  const fetch = globalThis.fetch as any
  
  // Stratégie 1: Restaurer le fetch original si disponible
  if (fetch._nextOriginalFetch) {
    try {
      globalThis.fetch = fetch._nextOriginalFetch
      return true
    } catch (error) {
    }
  }
  
  // Stratégie 2: Créer un nouveau fetch à partir d'une iframe
  try {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    
    const cleanFetch = iframe.contentWindow?.fetch
    document.body.removeChild(iframe)
    
    if (cleanFetch) {
      // Créer un wrapper qui préserve le context
      globalThis.fetch = cleanFetch.bind(window)
      return true
    }
  } catch (error) {
  }
  
  // Stratégie 3: Wrapper de protection contre CLIENT error
  try {
    const originalFetch = fetch._nextOriginalFetch || fetch
    
    globalThis.fetch = async function protectedFetch(input: RequestInfo | URL, init?: RequestInit) {
      try {
        return await originalFetch(input, init)
      } catch (error: any) {
        if (error?.message?.includes('CLIENT')) {
          // Utiliser XMLHttpRequest comme fallback immédiat
          const url = typeof input === 'string' ? input : input.toString()
          return new Promise<Response>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open(init?.method || 'GET', url)
            
            if (init?.headers) {
              const headers = init.headers as Record<string, string>
              Object.entries(headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value)
              })
            }
            
            xhr.onload = () => {
              resolve(new Response(xhr.responseText, {
                status: xhr.status,
                statusText: xhr.statusText
              }))
            }
            
            xhr.onerror = () => reject(new Error(`XHR failed: ${xhr.status}`))
            xhr.send(init?.body as string)
          })
        }
        throw error
      }
    }
    
    return true
  } catch (error) {
  }
  
  return false
}

// Auto-diagnostic et réparation au chargement du module
if (typeof window !== 'undefined') {
  // Exécuter immédiatement et aussi après délai
  const runDiagnostic = () => {
    diagnoseFetchCorruption()
    
    // Essayer la réparation si CLIENT error détecté ou si patché
    const testFetch = globalThis.fetch as any
    const needsRepair = testFetch?.toString().includes('CLIENT') || testFetch.__nextPatched
    
    
    if (needsRepair) {
      const repaired = attemptFetchRepair()
      if (repaired) {
      } else {
      }
    } else {
    }
  }
  
  // DÉSACTIVÉ TEMPORAIREMENT pour diagnostiquer l'erreur originale
  // runDiagnostic()
  // setTimeout(runDiagnostic, 500)
}