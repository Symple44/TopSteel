// Jest setup for API client package

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods for testing
global.console = {
  ...console,
  // Suppress logs during testing
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock environment variables
process.env.NODE_ENV = 'test'

// Setup for testing HTTP client
beforeEach(() => {
  jest.clearAllMocks()

  // Reset fetch mock
  if (global.fetch.mockClear) {
    global.fetch.mockClear()
  }
})

afterEach(() => {
  jest.clearAllMocks()
})
