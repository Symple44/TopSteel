/**
 * CSP Testing Utilities
 *
 * This module provides utilities to test CSP implementation and identify violations
 */

export interface CSPTestResult {
  passed: boolean
  violations: CSPViolation[]
  recommendations: string[]
}

export interface CSPViolation {
  type: 'script' | 'style' | 'img' | 'connect' | 'font' | 'frame' | 'other'
  source: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  line?: number
  column?: number
}

/**
 * Test current page for CSP compliance
 */
export function testPageCSP(): CSPTestResult {
  const violations: CSPViolation[] = []
  const recommendations: string[] = []

  // Test for inline scripts
  const inlineScripts = document.querySelectorAll('script:not([src])')
  for (const script of inlineScripts) {
    if (!script?.hasAttribute('nonce')) {
      violations?.push({
        type: 'script',
        source: 'inline',
        description: 'Inline script without nonce detected',
        severity: 'high',
      })
    }
  }

  // Test for inline styles
  const inlineStyles = document.querySelectorAll('style:not([nonce])')
  for (const _style of inlineStyles) {
    violations?.push({
      type: 'style',
      source: 'inline',
      description: 'Inline style without nonce detected',
      severity: 'medium',
    })
  }

  // Test for elements with style attribute
  const elementsWithStyle = document.querySelectorAll('[style]')
  for (const _element of elementsWithStyle) {
    violations?.push({
      type: 'style',
      source: 'attribute',
      description: 'Element with inline style attribute detected',
      severity: 'medium',
    })
  }

  // Test for unsafe attributes
  const unsafeAttributes = ['onclick', 'onload', 'onerror', 'onmouseover']
  for (const attr of unsafeAttributes) {
    const elementsWithUnsafeAttr = document.querySelectorAll(`[${attr}]`)
    for (const _element of elementsWithUnsafeAttr) {
      violations?.push({
        type: 'script',
        source: attr,
        description: `Element with ${attr} attribute detected`,
        severity: 'critical',
      })
    }
  }

  // Generate recommendations
  if (violations?.some((v) => v.type === 'script' && v.source === 'inline')) {
    recommendations?.push('Move inline scripts to external files or add nonce attributes')
  }

  if (violations?.some((v) => v.type === 'style')) {
    recommendations?.push(
      'Use CSS classes instead of inline styles, or add nonce to style elements'
    )
  }

  if (violations?.some((v) => v.severity === 'critical')) {
    recommendations?.push('Remove all inline event handlers - use addEventListener instead')
  }

  return {
    passed: violations.length === 0,
    violations,
    recommendations,
  }
}

/**
 * Monitor CSP violations in real-time
 */
export function monitorCSPViolations(callback: (violation: SecurityPolicyViolationEvent) => void) {
  if (typeof document === 'undefined') return undefined

  const handleViolation = (e: SecurityPolicyViolationEvent) => {
    callback(e)
  }

  document.addEventListener('securitypolicyviolation', handleViolation)

  // Return cleanup function
  return () => {
    document.removeEventListener('securitypolicyviolation', handleViolation)
  }
}

/**
 * Check if CSP nonce is properly set
 */
export function validateCSPNonce(): {
  hasNonce: boolean
  nonce?: string
  source: 'meta' | 'script' | 'none'
} {
  // Check meta tag
  const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')
  if (metaNonce) {
    return { hasNonce: true, nonce: metaNonce, source: 'meta' }
  }

  // Check script tags
  const scripts = document.querySelectorAll('script[nonce]')
  if (scripts?.length > 0) {
    const nonce = scripts?.[0]?.getAttribute('nonce')
    return { hasNonce: !!nonce, nonce: nonce || undefined, source: 'script' }
  }

  return { hasNonce: false, source: 'none' }
}

/**
 * Test CSP headers from network response
 */
export async function testCSPHeaders(url: string = window.location.href): Promise<{
  hasCSP: boolean
  policy?: string
  reportOnly: boolean
  issues: string[]
}> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const csp = response?.headers?.get('Content-Security-Policy')
    const cspRO = response?.headers?.get('Content-Security-Policy-Report-Only')

    const policy = csp || cspRO
    const issues: string[] = []

    if (!policy) {
      issues?.push('No CSP header found')
      return { hasCSP: false, reportOnly: false, issues }
    }

    // Check for unsafe directives
    if (policy?.includes("'unsafe-inline'")) {
      issues?.push("CSP contains 'unsafe-inline' directive")
    }

    if (policy?.includes("'unsafe-eval'")) {
      issues?.push("CSP contains 'unsafe-eval' directive")
    }

    if (!policy?.includes('nonce-')) {
      issues?.push('No nonce-based directives found')
    }

    if (!policy?.includes('report-uri')) {
      issues?.push('No CSP violation reporting configured')
    }

    return {
      hasCSP: true,
      policy,
      reportOnly: !!cspRO,
      issues,
    }
  } catch (error) {
    return {
      hasCSP: false,
      reportOnly: false,
      issues: [`Failed to test CSP headers: ${error}`],
    }
  }
}

/**
 * Generate CSP test report for development
 */
export async function generateCSPReport(): Promise<string> {
  const pageTest = testPageCSP()
  const nonceValidation = validateCSPNonce()
  const headerTest = await testCSPHeaders()

  let report = '# CSP Security Report\n\n'

  // Page CSP Test
  report += '## Page CSP Test\n'
  report += `**Status:** ${pageTest?.passed ? '✅ PASSED' : '❌ FAILED'}\n`
  report += `**Violations Found:** ${pageTest?.violations?.length}\n\n`

  if (pageTest?.violations?.length > 0) {
    report += '### Violations:\n'
    for (const violation of pageTest?.violations || []) {
      report += `- **${violation?.severity?.toUpperCase()}**: ${violation.description}\n`
    }
    report += '\n'
  }

  if (pageTest?.recommendations?.length > 0) {
    report += '### Recommendations:\n'
    for (const rec of pageTest?.recommendations || []) {
      report += `- ${rec}\n`
    }
    report += '\n'
  }

  // Nonce Validation
  report += '## Nonce Validation\n'
  report += `**Has Nonce:** ${nonceValidation?.hasNonce ? '✅ YES' : '❌ NO'}\n`
  if (nonceValidation?.hasNonce) {
    report += `**Source:** ${nonceValidation?.source}\n`
    report += `**Nonce:** ${nonceValidation?.nonce?.substring(0, 8)}...\n`
  }
  report += '\n'

  // Header Test
  report += '## CSP Headers\n'
  report += `**Has CSP:** ${headerTest?.hasCSP ? '✅ YES' : '❌ NO'}\n`
  report += `**Report Only:** ${headerTest?.reportOnly ? '⚠️ YES' : '✅ NO'}\n`

  if (headerTest?.issues?.length > 0) {
    report += '### Issues:\n'
    for (const issue of headerTest?.issues || []) {
      report += `- ${issue}\n`
    }
  }

  return report
}

/**
 * Development helper: log CSP report to console
 */
export async function logCSPReport(): Promise<void> {
  if (process?.env?.NODE_ENV !== 'development') return

  const _report = await generateCSPReport()
}
