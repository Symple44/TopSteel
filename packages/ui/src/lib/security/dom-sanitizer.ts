/**
 * DOMPurify HTML Sanitization Utilities
 * 
 * This module provides standardized HTML sanitization functions to prevent XSS vulnerabilities
 * when using dangerouslySetInnerHTML in React components.
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Default configuration for rich text content
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'div', 'span',
    'a', 'img', 'blockquote'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onmouseout', 'onchange']
}

/**
 * Minimal configuration for search highlights and simple text
 */
const HIGHLIGHT_CONFIG = {
  ALLOWED_TAGS: ['mark', 'strong', 'em', 'span'],
  ALLOWED_ATTR: ['class'],
  KEEP_CONTENT: true,
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onmouseout', 'onchange']
}

/**
 * Basic configuration for simple formatted text
 */
const BASIC_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span'],
  ALLOWED_ATTR: ['class'],
  ALLOW_DATA_ATTR: false,
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onmouseout', 'onchange']
}

/**
 * Sanitize HTML content for rich text editors and content management
 * 
 * @param html - The HTML string to sanitize
 * @param customConfig - Optional custom DOMPurify configuration
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeRichText(html: string, customConfig?: any): string {
  if (!html) return ''
  
  const config = customConfig ? { ...RICH_TEXT_CONFIG, ...customConfig } : RICH_TEXT_CONFIG
  return DOMPurify.sanitize(html, config) as unknown as string
}

/**
 * Sanitize HTML content for search highlights and simple formatting
 * 
 * @param html - The HTML string to sanitize
 * @param customConfig - Optional custom DOMPurify configuration
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHighlight(html: string, customConfig?: any): string {
  if (!html) return ''
  
  const config = customConfig ? { ...HIGHLIGHT_CONFIG, ...customConfig } : HIGHLIGHT_CONFIG
  return DOMPurify.sanitize(html, config) as unknown as string
}

/**
 * Sanitize HTML content with basic formatting only
 * 
 * @param html - The HTML string to sanitize
 * @param customConfig - Optional custom DOMPurify configuration
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeBasic(html: string, customConfig?: any): string {
  if (!html) return ''
  
  const config = customConfig ? { ...BASIC_CONFIG, ...customConfig } : BASIC_CONFIG
  return DOMPurify.sanitize(html, config) as unknown as string
}

/**
 * Generic sanitization function with custom configuration
 * 
 * @param html - The HTML string to sanitize
 * @param config - DOMPurify configuration object
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string, config: any): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, config) as unknown as string
}

/**
 * Validate if a string contains potentially dangerous content
 * 
 * @param html - The HTML string to validate
 * @returns true if the content appears safe, false if it contains suspicious patterns
 */
export function validateHtmlSafety(html: string): boolean {
  if (!html) return true
  
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /data:text\/html/i,
    /vbscript:/i
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(html))
}

/**
 * Pre-configured sanitization functions for common use cases
 */
export const DOMSanitizer = {
  richText: sanitizeRichText,
  highlight: sanitizeHighlight,
  basic: sanitizeBasic,
  custom: sanitizeHtml,
  validate: validateHtmlSafety,
  
  // Configuration presets
  configs: {
    RICH_TEXT: RICH_TEXT_CONFIG,
    HIGHLIGHT: HIGHLIGHT_CONFIG,
    BASIC: BASIC_CONFIG
  }
}

export default DOMSanitizer