// OpenTelemetry polyfill to prevent api.createContextKey errors
const mockSpan = {
  end: () => {},
  setStatus: () => {},
  setAttributes: () => {},
  setAttribute: () => {},
  addEvent: () => {},
  recordException: () => {},
  updateName: () => {},
}

const mockSpanContext = {
  traceId: 'disabled',
  spanId: 'disabled',
  setValue: () => mockSpanContext,
  getValue: () => undefined,
  deleteValue: () => mockSpanContext,
}

const mockContext = {
  getValue: () => undefined,
  setValue: () => mockContext,
  deleteValue: () => mockContext,
}

const mockApi = {
  createContextKey: () => ({ __key: 'disabled' }),
  context: {
    active: () => mockContext,
    with: (_context, fn) => fn(),
    bind: () => () => {},
  },
  trace: {
    getTracer: () => ({
      startSpan: () => mockSpan,
    }),
    getSpan: () => mockSpan,
    getSpanContext: () => mockSpanContext,
    setSpan: () => mockContext,
    getActiveSpan: () => mockSpan,
  },
  metrics: {
    getMeter: () => ({}),
  },
  baggage: {
    active: () => mockContext,
    getActiveBaggage: () => mockContext,
    setBaggage: () => mockContext,
  },
  propagation: {
    inject: () => {},
    extract: () => mockContext,
    createBaggage: () => mockContext,
  },
}

// Export both as default and named exports for compatibility
export default mockApi
export const createContextKey = mockApi.createContextKey
export const context = mockApi.context
export const trace = mockApi.trace
export const metrics = mockApi.metrics
export const baggage = mockApi.baggage
export const propagation = mockApi.propagation

// Additional exports that might be needed
export const getSpan = mockApi.trace.getSpan
export const getSpanContext = mockApi.trace.getSpanContext
export const setSpan = mockApi.trace.setSpan
export const getActiveSpan = mockApi.trace.getActiveSpan

// Context and baggage exports
export const active = mockApi.context.active
export const setValue = (_key, _value, _context) => mockContext
export const getValue = (_key, _context) => undefined
export const deleteValue = (_key, _context) => mockContext
