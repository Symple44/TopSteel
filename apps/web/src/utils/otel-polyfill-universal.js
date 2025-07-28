// Universal OpenTelemetry polyfill - handles any property access
const noop = () => {}

// Create a universal mock that handles any method call
const createUniversalMock = () => {
  return new Proxy({}, {
    get(target, prop) {
      // Return appropriate values for common properties
      if (prop === 'traceId' || prop === 'spanId') return 'disabled'
      if (prop === '__key') return 'disabled'
      if (prop === Symbol.toPrimitive || prop === 'valueOf') return () => 'disabled'
      if (prop === 'toString') return () => 'disabled'
      
      // For any function call, return a function that handles various call patterns
      return (...args) => {
        // If the last argument is a function (callback pattern), call it with a mock
        const lastArg = args[args.length - 1]
        if (typeof lastArg === 'function') {
          return lastArg(createUniversalMock())
        }
        
        // If the second-to-last argument is a function (context, callback pattern)
        const secondLastArg = args[args.length - 2]
        if (typeof secondLastArg === 'function') {
          return secondLastArg(createUniversalMock())
        }
        
        // Otherwise return a new mock
        return createUniversalMock()
      }
    },
    
    set(target, prop, value) {
      // Allow setting any property
      return true
    },
    
    has(target, prop) {
      // Pretend we have any property
      return true
    }
  })
}

// Create the main API object
const mockApi = createUniversalMock()

// Export everything as both default and named exports
export default mockApi
export const createContextKey = () => createUniversalMock()
export const context = createUniversalMock()
export const trace = createUniversalMock()
export const metrics = createUniversalMock()
export const baggage = createUniversalMock()
export const propagation = createUniversalMock()
export const active = () => createUniversalMock()
export const getSpan = () => createUniversalMock()
export const getSpanContext = () => createUniversalMock()
export const setSpan = () => createUniversalMock()
export const getActiveSpan = () => createUniversalMock()
export const setValue = () => createUniversalMock()
export const getValue = () => undefined
export const deleteValue = () => createUniversalMock()
export const startActiveSpan = (...args) => {
  const lastArg = args[args.length - 1]
  if (typeof lastArg === 'function') {
    return lastArg(createUniversalMock())
  }
  return createUniversalMock()
}