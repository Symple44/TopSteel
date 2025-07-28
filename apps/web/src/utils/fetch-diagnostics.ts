// Diagnostic pour identifier le problème fetch CLIENT (mode silencieux)
export function diagnoseFetch() {
  // Diagnostic minimal et silencieux
  const fetchStatus = {
    fetchAvailable: typeof globalThis.fetch === 'function',
    fetchName: globalThis.fetch?.name || 'unknown',
    isPatched: globalThis.fetch && '__nextPatched' in globalThis.fetch,
    hasOriginal: globalThis.fetch && '_nextOriginalFetch' in globalThis.fetch
  }
  
  // Log uniquement si détection d'anomalie
  if (!fetchStatus.fetchAvailable) {
    console.warn('⚠️ Fetch non disponible')
  } else if (fetchStatus.isPatched && !fetchStatus.hasOriginal) {
    console.warn('⚠️ Fetch patché sans original de sauvegarde')
  }
}