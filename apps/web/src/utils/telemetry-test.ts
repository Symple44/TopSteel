// Test sécurisé pour OpenTelemetry
import { telemetryConfig, traceAPICall, traceUserAction } from '../lib/telemetry'

export async function testOpenTelemetry() {
  if (!telemetryConfig.enabled) {
  }

  try {
    // Test 1: Trace d'appel API
    const apiSpan = traceAPICall('health-check', '/api/v1/health', 'GET')

    // Simuler une latence
    await new Promise((resolve) => setTimeout(resolve, 100))

    apiSpan.setAttributes({
      'test.result': 'success',
      'test.duration_ms': 100,
    })
    apiSpan.end()

    // Test 2: Trace d'action utilisateur
    const userSpan = traceUserAction('login-attempt', 'test-user-123')

    await new Promise((resolve) => setTimeout(resolve, 50))

    userSpan.setAttributes({
      'test.action': 'login',
      'test.success': true,
    })
    userSpan.end()

    // Test 3: Vérifier que pas d'erreur CLIENT
    try {
      // Test avec plusieurs appels simultanés
      const promises = Array.from({ length: 3 }, async (_, i) => {
        const span = traceAPICall(`test-${i}`, `/api/test-${i}`)
        await new Promise((resolve) => setTimeout(resolve, 10))
        span.end()
        return `test-${i}-ok`
      })

      const _results = await Promise.all(promises)
    } catch (error) {
      if (error instanceof Error && error.message?.includes('CLIENT')) {
        throw new Error('OpenTelemetry cause encore une erreur CLIENT')
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message?.includes('CLIENT')) {
      return false
    }
  }

  return true
}

// Test automatique différé si activé
if (typeof window !== 'undefined' && process.env.OTEL_ENABLED === 'true') {
  setTimeout(testOpenTelemetry, 4000)
}
