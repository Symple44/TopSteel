/**
 * Code Security Policy
 * Defines and enforces security rules for dangerous code execution patterns
 */

/**
 * Security Policy Configuration
 */
export interface SecurityPolicyConfig {
  allowEval: boolean
  allowNewFunction: boolean
  allowInlineScripts: boolean
  allowDynamicImports: boolean
  trustedDomains: string[]
  maxExpressionLength: number
  enableLogging: boolean
}

/**
 * Default security policy (most restrictive)
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicyConfig = {
  allowEval: false,
  allowNewFunction: false,
  allowInlineScripts: false,
  allowDynamicImports: false,
  trustedDomains: ['localhost', 'topsteel.fr'],
  maxExpressionLength: 1000,
  enableLogging: process.env.NODE_ENV === 'development'
}

/**
 * Security violation types
 */
export enum ViolationType {
  EVAL_USAGE = 'EVAL_USAGE',
  NEW_FUNCTION = 'NEW_FUNCTION',
  INLINE_SCRIPT = 'INLINE_SCRIPT',
  DYNAMIC_IMPORT = 'DYNAMIC_IMPORT',
  UNTRUSTED_DOMAIN = 'UNTRUSTED_DOMAIN',
  EXPRESSION_TOO_LONG = 'EXPRESSION_TOO_LONG'
}

/**
 * Security violation details
 */
export interface SecurityViolation {
  type: ViolationType
  message: string
  source?: string
  timestamp: Date
  stackTrace?: string
}

/**
 * Code Security Policy Enforcer
 */
export class CodeSecurityPolicy {
  private static instance: CodeSecurityPolicy
  private config: SecurityPolicyConfig
  private violations: SecurityViolation[] = []

  private constructor(config?: Partial<SecurityPolicyConfig>) {
    this.config = { ...DEFAULT_SECURITY_POLICY, ...config }
    this.initializePolicy()
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<SecurityPolicyConfig>): CodeSecurityPolicy {
    if (!CodeSecurityPolicy.instance) {
      CodeSecurityPolicy.instance = new CodeSecurityPolicy(config)
    }
    return CodeSecurityPolicy.instance
  }

  /**
   * Initialize security policy
   */
  private initializePolicy(): void {
    if (typeof window !== 'undefined') {
      this.overrideEval()
      this.overrideFunction()
      this.setupCSPViolationReporting()
      this.monitorDynamicImports()
    }
  }

  /**
   * Override eval to prevent usage
   */
  private overrideEval(): void {
    if (!this.config.allowEval) {
      const originalEval = window.eval
      
      // Replace eval with a secured version
      ;(window as any).eval = (code: string) => {
        const violation: SecurityViolation = {
          type: ViolationType.EVAL_USAGE,
          message: 'eval() is disabled by security policy',
          source: code.substring(0, 100),
          timestamp: new Date(),
          stackTrace: new Error().stack
        }
        
        this.reportViolation(violation)
        throw new Error('eval() is disabled by security policy')
      }

      // Store original for emergency use (only in dev)
      if (process.env.NODE_ENV === 'development') {
        ;(window as any).__unsafeEval = originalEval
      }
    }
  }

  /**
   * Override Function constructor
   */
  private overrideFunction(): void {
    if (!this.config.allowNewFunction) {
      const OriginalFunction = Function
      
      // Replace Function constructor
      ;(window as any).Function = new Proxy(OriginalFunction, {
        construct: (target, args) => {
          const violation: SecurityViolation = {
            type: ViolationType.NEW_FUNCTION,
            message: 'new Function() is disabled by security policy',
            source: args.join(', ').substring(0, 100),
            timestamp: new Date(),
            stackTrace: new Error().stack
          }
          
          this.reportViolation(violation)
          throw new Error('new Function() is disabled by security policy')
        }
      })

      // Store original for emergency use (only in dev)
      if (process.env.NODE_ENV === 'development') {
        ;(window as any).__unsafeFunction = OriginalFunction
      }
    }
  }

  /**
   * Setup CSP violation reporting
   */
  private setupCSPViolationReporting(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        const violation: SecurityViolation = {
          type: ViolationType.INLINE_SCRIPT,
          message: `CSP Violation: ${event.violatedDirective}`,
          source: event.sourceFile || event.blockedURI || undefined,
          timestamp: new Date()
        }
        
        this.reportViolation(violation)
      })
    }
  }

  /**
   * Monitor dynamic imports
   */
  private monitorDynamicImports(): void {
    if (!this.config.allowDynamicImports) {
      // Intercept dynamic import() calls
      const originalImport = (window as any).import
      if (originalImport) {
        ;(window as any).import = async (specifier: string) => {
          // Check if the import is from a trusted domain
          try {
            const url = new URL(specifier, window.location.href)
            const isTrusted = this.config.trustedDomains.some(domain => 
              url.hostname === domain || url.hostname.endsWith(`.${domain}`)
            )
            
            if (!isTrusted) {
              const violation: SecurityViolation = {
                type: ViolationType.DYNAMIC_IMPORT,
                message: `Dynamic import from untrusted source: ${specifier}`,
                source: specifier,
                timestamp: new Date(),
                stackTrace: new Error().stack
              }
              
              this.reportViolation(violation)
              throw new Error(`Dynamic import from untrusted source is not allowed`)
            }
          } catch (error) {
            // If URL parsing fails, it might be a relative import (allowed)
            if (!(error instanceof TypeError)) {
              throw error
            }
          }
          
          return originalImport(specifier)
        }
      }
    }
  }

  /**
   * Report a security violation
   */
  private reportViolation(violation: SecurityViolation): void {
    this.violations.push(violation)
    
    if (this.config.enableLogging) {
      console.error('🚨 Security Violation:', violation)
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendViolationToMonitoring(violation)
    }
    
    // Trigger custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-violation', { 
        detail: violation 
      }))
    }
  }

  /**
   * Send violation to monitoring service
   */
  private async sendViolationToMonitoring(violation: SecurityViolation): Promise<void> {
    try {
      await fetch('/api/security/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      })
    } catch (error) {
      console.error('Failed to report security violation:', error)
    }
  }

  /**
   * Get all violations
   */
  getViolations(): SecurityViolation[] {
    return [...this.violations]
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = []
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SecurityPolicyConfig>): void {
    this.config = { ...this.config, ...config }
    // Re-initialize with new config
    this.initializePolicy()
  }

  /**
   * Check if a code string is safe
   */
  isCodeSafe(code: string): boolean {
    const dangerousPatterns = [
      /\beval\s*\(/gi,
      /\bnew\s+Function\s*\(/gi,
      /\bFunction\s*\(/gi,
      /\b__proto__\b/gi,
      /\bconstructor\b.*\(/gi,
      /\bprototype\b.*=/gi,
      /\bwindow\[/gi,
      /\bglobal\[/gi,
      /\bprocess\b/gi,
      /\brequire\s*\(/gi,
      /\bimport\s*\(/gi
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(code))
  }

  /**
   * Sanitize code by removing dangerous patterns
   */
  sanitizeCode(code: string): string {
    let sanitized = code
    
    // Remove eval calls
    sanitized = sanitized.replace(/\beval\s*\([^)]*\)/gi, '/* eval removed */')
    
    // Remove Function constructor calls
    sanitized = sanitized.replace(/\bnew\s+Function\s*\([^)]*\)/gi, '/* new Function removed */')
    
    // Remove prototype manipulation
    sanitized = sanitized.replace(/\.__proto__\s*=/gi, '/* __proto__ assignment removed */')
    
    return sanitized
  }
}

/**
 * Initialize security policy on app start
 */
export function initializeSecurityPolicy(config?: Partial<SecurityPolicyConfig>): void {
  if (typeof window !== 'undefined') {
    const policy = CodeSecurityPolicy.getInstance(config)
    
    // Make policy available globally for debugging (dev only)
    if (process.env.NODE_ENV === 'development') {
      ;(window as any).__securityPolicy = policy
    }
  }
}

/**
 * React hook for security policy
 */
export function useSecurityPolicy() {
  const policy = CodeSecurityPolicy.getInstance()
  
  return {
    checkCode: (code: string) => policy.isCodeSafe(code),
    sanitize: (code: string) => policy.sanitizeCode(code),
    getViolations: () => policy.getViolations(),
    clearViolations: () => policy.clearViolations()
  }
}

// Export singleton instance
export const securityPolicy = CodeSecurityPolicy.getInstance()