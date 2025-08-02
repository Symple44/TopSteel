// Test pour déclencher et diagnostiquer l'erreur CLIENT

export async function testClientError() {
  const testUrls = [
    'http://127.0.0.1:3002/api/health',
    'http://127.0.0.1:3002/api/test',
    'http://localhost:3002/api/health',
  ]

  for (const url of testUrls) {
    try {
      // Test direct avec fetch patché
      const directFetch = globalThis.fetch
      const _response = await directFetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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
        const _response = await originalFetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (_error: any) {}
  }
}

// Test automatique différé
if (typeof window !== 'undefined') {
  setTimeout(testClientError, 2000)
}
