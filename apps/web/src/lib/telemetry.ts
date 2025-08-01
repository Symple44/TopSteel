// Configuration OpenTelemetry sécurisée pour TopSteel ERP
// import { trace, context, propagation } from '@opentelemetry/api'

// Types de remplacement pour quand OpenTelemetry n'est pas disponible
type MockSpan = {
  setStatus: (status: any) => void
  recordException: (error: any) => void
  setAttributes: (attributes: any) => void
  end: () => void
}

type MockTracer = {
  startSpan: (name: string, options?: any) => MockSpan
}

// Mock objects pour OpenTelemetry
const mockSpan: MockSpan = {
  setStatus: () => {},
  recordException: () => {},
  setAttributes: () => {},
  end: () => {},
}

const mockTracer: MockTracer = {
  startSpan: () => mockSpan,
}

// Utiliser les mocks par défaut
const trace = { getTracer: () => mockTracer }
const _context = { active: () => ({}), with: (_ctx: any, fn: any) => fn() }
const _propagation = { inject: () => {}, extract: () => ({}) }

// Configuration minimale et sécurisée
export const telemetryConfig = {
  serviceName: 'topsteel-erp-web',
  serviceVersion: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.OTEL_ENABLED === 'true' || process.env.NODE_ENV === 'production',
}

// Mock sécurisé si OpenTelemetry est désactivé
export const safeTracer = telemetryConfig.enabled
  ? trace.getTracer()
  : {
      startSpan: () => ({
        end: () => {},
        setStatus: () => {},
        setAttributes: () => {},
        recordException: () => {},
      }),
      startActiveSpan: (_name: string, fn: any) =>
        fn({
          end: () => {},
          setStatus: () => {},
          setAttributes: () => {},
          recordException: () => {},
        }),
    }

// Utilitaires de tracing sécurisés
export function traceAPICall(name: string, url: string, method: string = 'GET') {
  if (!telemetryConfig.enabled) return { end: () => {}, setAttributes: () => {} }

  const span = safeTracer.startSpan(`api.${method.toLowerCase()}.${name}`)
  span.setAttributes({
    'http.method': method,
    'http.url': url,
    'service.name': telemetryConfig.serviceName,
  })

  return span
}

export function traceUserAction(action: string, userId?: string) {
  if (!telemetryConfig.enabled) return { end: () => {}, setAttributes: () => {} }

  const span = safeTracer.startSpan(`user.action.${action}`)
  if (userId) {
    span.setAttributes({ 'user.id': userId })
  }

  return span
}
