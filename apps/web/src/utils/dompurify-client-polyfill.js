/**
 * Client-side polyfill for isomorphic-dompurify
 * Uses native browser DOMPurify instead of jsdom-based version
 */

// Export a compatible interface with lazy loading
export default {
  sanitize: (html, config) => {
    if (typeof window === 'undefined') {
      // Server-side: return as-is (will be sanitized on client)
      return html
    }

    // Lazy load DOMPurify on client-side only when needed
    try {
      // Use require for synchronous loading in browser context
      const dompurify = require('dompurify')
      const DOMPurify = dompurify.default || dompurify
      return DOMPurify.sanitize(html, config)
    } catch (error) {
      // Fallback: return unsanitized if DOMPurify fails to load
      console.warn('DOMPurify not available, returning unsanitized HTML', error)
      return html
    }
  },
}
