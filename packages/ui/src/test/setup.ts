import '@testing-library/jest-dom'
import { vi } from 'vitest'

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.scrollTo = vi.fn()

window.URL.createObjectURL = vi.fn(() => 'blob:mock')
window.URL.revokeObjectURL = vi.fn()

// Mock document methods for testing
const originalCreateElement = document.createElement
document.createElement = vi.fn().mockImplementation((tagName) => {
  const element = originalCreateElement.call(document, tagName)
  if (tagName === 'a') {
    Object.defineProperty(element, 'click', {
      value: vi.fn(),
      writable: true,
    })
  }
  return element
})

// Ensure document.body exists
if (!document.body) {
  document.body = document.createElement('body')
}

// Mock Blob for file operations
global.Blob = vi.fn().mockImplementation((content, options) => ({
  content,
  options,
  type: options?.type || 'text/plain',
  size: content.length,
})) as any

if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
  })
}
