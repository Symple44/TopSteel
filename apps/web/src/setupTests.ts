import '@testing-library/jest-dom'

// Extend Jest matchers with module declaration
declare module '@jest/expect' {
  interface Matchers<R> {
    toBeInTheDocument(): R
  }
}
