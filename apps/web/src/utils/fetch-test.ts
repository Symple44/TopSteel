// Test pour déclencher et diagnostiquer l'erreur CLIENT

export async function testClientError() {
  
  const testUrls = [
    'http://127.0.0.1:3002/api/v1/health',
    'http://127.0.0.1:3002/api/v1/test',
    'http://localhost:3002/api/v1/health'
  ]
  
  for (const url of testUrls) {
    
    try {
      // Test direct avec fetch patché
      const directFetch = globalThis.fetch
      const response = await directFetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      if (error?.message?.includes('CLIENT')) {
      }
    }
    
    try {
      // Test avec fetch original si disponible
      const patchedFetch = globalThis.fetch as any
      const originalFetch = patchedFetch._nextOriginalFetch
      
      if (originalFetch) {
        const response = await originalFetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } catch (error: any) {
    }
  }
  
}

// Test automatique différé
if (typeof window !== 'undefined') {
  setTimeout(testClientError, 2000)
}