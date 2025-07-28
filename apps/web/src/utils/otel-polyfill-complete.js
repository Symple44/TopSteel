// Complete OpenTelemetry polyfill for Next.js 15
const noop = () => {}
const mockReturn = () => mockContext

// Create a proxy that returns mock functions for any property access
const createMockProxy = (defaultReturn = noop) => {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'getValue') return () => undefined
      if (prop === 'setValue') return mockReturn
      if (prop === 'deleteValue') return mockReturn
      if (prop === 'active') return () => createMockProxy()
      if (prop === 'with') return (ctx, fn) => fn()
      if (prop === 'bind') return () => noop
      if (prop === 'startSpan') return () => createMockProxy()
      if (prop === 'startActiveSpan') return (name, options, context, fn) => {
        // Handle both 3 and 4 parameter versions
        if (typeof context === 'function') {
          return context(createMockProxy())
        }
        if (typeof fn === 'function') {
          return fn(createMockProxy())
        }
        return createMockProxy()
      }
      if (prop === 'getSpan') return () => createMockProxy()
      if (prop === 'getSpanContext') return () => createMockProxy()
      if (prop === 'setSpan') return mockReturn
      if (prop === 'getActiveSpan') return () => createMockProxy()
      if (prop === 'getTracer') return () => createMockProxy()
      if (prop === 'getTracerInstance') return () => createMockProxy()
      if (prop === 'getMeter') return () => createMockProxy()
      if (prop === 'inject') return noop
      if (prop === 'extract') return () => createMockProxy()
      if (prop === 'createBaggage') return () => createMockProxy()
      if (prop === 'end') return noop
      if (prop === 'setStatus') return noop
      if (prop === 'setAttribute') return noop
      if (prop === 'setAttributes') return noop
      if (prop === 'addEvent') return noop
      if (prop === 'recordException') return noop
      if (prop === 'updateName') return noop
      if (prop === 'traceId') return 'disabled'
      if (prop === 'spanId') return 'disabled'
      if (prop === '__key') return 'disabled'
      
      // For any other property, return a mock proxy
      return createMockProxy()
    }
  })
}

const mockContext = createMockProxy()

const mockApi = {
  createContextKey: () => createMockProxy(),
  context: createMockProxy(),
  trace: createMockProxy(),
  metrics: createMockProxy(),
  baggage: createMockProxy(),
  propagation: createMockProxy(),
}

// Export everything
export default mockApi
export const createContextKey = mockApi.createContextKey
export const context = mockApi.context
export const trace = mockApi.trace
export const metrics = mockApi.metrics
export const baggage = mockApi.baggage
export const propagation = mockApi.propagation
export const active = () => mockContext
export const getSpan = () => mockContext
export const getSpanContext = () => mockContext
export const setSpan = () => mockContext
export const getActiveSpan = () => mockContext
export const setValue = () => mockContext
export const getValue = () => undefined
export const deleteValue = () => mockContext