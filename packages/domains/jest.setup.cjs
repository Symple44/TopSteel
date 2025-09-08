// Jest setup for domains package

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

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  jest.clearAllMocks()
})
