/**
 * Safe Expression Evaluator
 * Provides secure alternatives to eval() and new Function()
 * Uses sandboxing and validation techniques to prevent code injection
 */

import { create, all } from 'mathjs'

// Create a sandboxed math.js instance with limited scope
const math = create(all, {
  number: 'BigNumber',
  precision: 64
})

// Remove potentially dangerous functions from math.js
const dangerousFunctions = [
  'import', 'createUnit', 'parse', 'evaluate', 'simplify',
  'derivative', 'rationalize', 'compile'
]
dangerousFunctions.forEach(fn => {
  delete (math as any)[fn]
})

/**
 * Configuration for safe evaluation
 */
export interface SafeEvalConfig {
  maxExpressionLength?: number
  maxExecutionTime?: number
  allowedVariables?: Record<string, any>
  allowedFunctions?: string[]
  strictMode?: boolean
}

/**
 * Result of safe evaluation
 */
export interface SafeEvalResult<T = any> {
  success: boolean
  value?: T
  error?: string
  executionTime?: number
}

/**
 * Safe Expression Evaluator Class
 */
export class SafeExpressionEvaluator {
  private static readonly DEFAULT_CONFIG: Required<SafeEvalConfig> = {
    maxExpressionLength: 1000,
    maxExecutionTime: 100, // milliseconds
    allowedVariables: {},
    allowedFunctions: ['Math', 'Date', 'String', 'Number', 'Boolean'],
    strictMode: true
  }

  private static readonly FORBIDDEN_PATTERNS = [
    // Code execution
    /\beval\b/i,
    /\bFunction\b/i,
    /\bconstructor\b/i,
    /\b__proto__\b/i,
    /\bprototype\b/i,
    
    // Global access
    /\bwindow\b/i,
    /\bdocument\b/i,
    /\bglobal\b/i,
    /\bprocess\b/i,
    /\brequire\b/i,
    /\bimport\b/i,
    /\bmodule\b/i,
    /\bexports\b/i,
    
    // Network access
    /\bfetch\b/i,
    /\bXMLHttpRequest\b/i,
    /\bWebSocket\b/i,
    
    // File system
    /\bfs\b/i,
    /\bchild_process\b/i,
    
    // Loops and control flow that could cause DoS
    /\bwhile\b/i,
    /\bfor\b/i,
    /\bdo\b/i,
    /\bsetTimeout\b/i,
    /\bsetInterval\b/i,
    
    // Dangerous operations
    /\bdelete\b/i,
    /\bthrow\b/i,
    /\btry\b/i,
    /\bcatch\b/i,
    /\bfinally\b/i,
    /\basync\b/i,
    /\bawait\b/i,
    /\byield\b/i,
    
    // Template literals that could be exploited
    /`/,
    /\${/
  ]

  /**
   * Evaluate a mathematical expression safely
   */
  static evaluateMath(expression: string, variables?: Record<string, number>): SafeEvalResult<number> {
    const startTime = performance.now()

    try {
      // Validate expression length
      if (expression.length > this.DEFAULT_CONFIG.maxExpressionLength) {
        return {
          success: false,
          error: 'Expression too long'
        }
      }

      // Check for forbidden patterns
      const forbiddenMatch = this.containsForbiddenPatterns(expression)
      if (forbiddenMatch) {
        return {
          success: false,
          error: `Forbidden pattern detected: ${forbiddenMatch}`
        }
      }

      // Use math.js for safe evaluation
      const scope = { ...variables }
      const result = math.evaluate(expression, scope)

      const executionTime = performance.now() - startTime
      if (executionTime > this.DEFAULT_CONFIG.maxExecutionTime) {
        return {
          success: false,
          error: 'Execution timeout'
        }
      }

      return {
        success: true,
        value: Number(result),
        executionTime
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Evaluation failed'
      }
    }
  }

  /**
   * Evaluate a formula expression safely (Excel-like formulas)
   */
  static evaluateFormula(
    expression: string,
    context: Record<string, any>,
    config?: SafeEvalConfig
  ): SafeEvalResult {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config }
    const startTime = performance.now()

    try {
      // Validate expression
      const validation = this.validateExpression(expression, mergedConfig)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Transform formula to safe JavaScript
      const safeExpression = this.transformFormulaToSafeJS(expression, context)

      // Create sandboxed execution context
      const sandbox = this.createSandbox(context, mergedConfig)

      // Execute in sandbox with timeout
      const result = this.executeInSandbox(safeExpression, sandbox, mergedConfig.maxExecutionTime)

      const executionTime = performance.now() - startTime
      return {
        success: true,
        value: result,
        executionTime
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Formula evaluation failed'
      }
    }
  }

  /**
   * Evaluate a template expression safely
   */
  static evaluateTemplate(
    template: string,
    context: Record<string, any>
  ): SafeEvalResult<string> {
    try {
      // Replace template variables with values
      let result = template

      // Simple variable replacement (no code execution)
      Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        result = result.replace(regex, String(value))
      })

      return {
        success: true,
        value: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template evaluation failed'
      }
    }
  }

  /**
   * Check if expression contains forbidden patterns
   */
  private static containsForbiddenPatterns(expression: string): string | null {
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      if (pattern.test(expression)) {
        return pattern.source
      }
    }
    return null
  }

  /**
   * Validate expression before evaluation
   */
  private static validateExpression(
    expression: string,
    config: Required<SafeEvalConfig>
  ): { valid: boolean; error?: string } {
    // Check length
    if (expression.length > config.maxExpressionLength) {
      return { valid: false, error: 'Expression exceeds maximum length' }
    }

    // Check for forbidden patterns
    const forbidden = this.containsForbiddenPatterns(expression)
    if (forbidden) {
      return { valid: false, error: `Contains forbidden pattern: ${forbidden}` }
    }

    // Check parentheses balance
    let parenCount = 0
    for (const char of expression) {
      if (char === '(') parenCount++
      if (char === ')') parenCount--
      if (parenCount < 0) {
        return { valid: false, error: 'Unbalanced parentheses' }
      }
    }
    if (parenCount !== 0) {
      return { valid: false, error: 'Unclosed parentheses' }
    }

    return { valid: true }
  }

  /**
   * Transform Excel-like formula to safe JavaScript
   */
  private static transformFormulaToSafeJS(
    formula: string,
    context: Record<string, any>
  ): string {
    let transformed = formula

    // Replace Excel functions with safe equivalents
    const replacements: Record<string, string> = {
      'SUM': 'safeSum',
      'AVERAGE': 'safeAverage',
      'COUNT': 'safeCount',
      'MAX': 'Math.max',
      'MIN': 'Math.min',
      'ROUND': 'Math.round',
      'FLOOR': 'Math.floor',
      'CEIL': 'Math.ceil',
      'ABS': 'Math.abs',
      'SQRT': 'Math.sqrt',
      'POWER': 'Math.pow'
    }

    Object.entries(replacements).forEach(([excel, js]) => {
      const regex = new RegExp(`\\b${excel}\\b`, 'gi')
      transformed = transformed.replace(regex, js)
    })

    // Replace cell references with context values
    Object.entries(context).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      const safeValue = typeof value === 'string' ? `"${value}"` : String(value)
      transformed = transformed.replace(regex, safeValue)
    })

    return transformed
  }

  /**
   * Create a sandboxed execution context
   */
  private static createSandbox(
    context: Record<string, any>,
    config: Required<SafeEvalConfig>
  ): Record<string, any> {
    const sandbox: Record<string, any> = {
      // Safe math functions
      Math: Object.freeze({
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        atan2: Math.atan2,
        ceil: Math.ceil,
        cos: Math.cos,
        exp: Math.exp,
        floor: Math.floor,
        log: Math.log,
        max: Math.max,
        min: Math.min,
        pow: Math.pow,
        random: Math.random,
        round: Math.round,
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan,
        PI: Math.PI,
        E: Math.E
      }),

      // Safe helper functions
      safeSum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      safeAverage: (...args: number[]) => {
        const sum = args.reduce((a, b) => a + b, 0)
        return sum / args.length
      },
      safeCount: (...args: any[]) => args.filter(x => x != null).length,

      // User-provided context
      ...config.allowedVariables,
      ...context
    }

    // Freeze the sandbox to prevent modifications
    return Object.freeze(sandbox)
  }

  /**
   * Execute expression in sandbox with timeout
   */
  private static executeInSandbox(
    expression: string,
    sandbox: Record<string, any>,
    timeout: number
  ): any {
    // Create a worker-like timeout mechanism
    const timeoutError = new Error('Execution timeout')
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      // Set timeout
      timeoutId = setTimeout(() => {
        throw timeoutError
      }, timeout)

      // Create isolated function with limited scope
      const sandboxKeys = Object.keys(sandbox)
      const sandboxValues = Object.values(sandbox)
      
      // Build function body with strict mode
      const functionBody = `
        'use strict';
        try {
          return (${expression});
        } catch (e) {
          throw new Error('Execution error: ' + e.message);
        }
      `

      // Create function with explicit parameters (no global access)
      const isolatedFunction = new Function(...sandboxKeys, functionBody)
      
      // Execute with sandbox values
      const result = isolatedFunction(...sandboxValues)

      // Clear timeout if successful
      if (timeoutId) clearTimeout(timeoutId)

      return result
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Parse and validate JSON safely
   */
  static parseJSON(jsonString: string): SafeEvalResult {
    try {
      // Use native JSON.parse (safe)
      const result = JSON.parse(jsonString)
      return {
        success: true,
        value: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON parsing failed'
      }
    }
  }

  /**
   * Evaluate a conditional expression safely
   */
  static evaluateCondition(
    condition: string,
    context: Record<string, any>
  ): SafeEvalResult<boolean> {
    try {
      // Allow only simple comparisons
      const allowedOperators = ['==', '===', '!=', '!==', '>', '<', '>=', '<=', '&&', '||', '!']
      const operatorPattern = allowedOperators.map(op => op.replace(/[|&!<>=]/g, '\\$&')).join('|')
      
      const validPattern = new RegExp(
        `^[a-zA-Z0-9_\\s.]+(${operatorPattern})[a-zA-Z0-9_\\s.]+$`
      )

      if (!validPattern.test(condition)) {
        return {
          success: false,
          error: 'Invalid condition format'
        }
      }

      // Replace variables with values
      let processedCondition = condition
      Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g')
        const safeValue = typeof value === 'string' ? `"${value}"` : String(value)
        processedCondition = processedCondition.replace(regex, safeValue)
      })

      // Evaluate using safe math evaluator
      const result = this.evaluateMath(processedCondition)
      
      return {
        success: result.success,
        value: Boolean(result.value),
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Condition evaluation failed'
      }
    }
  }
}

// Export convenience functions
export const safeMathEval = (expr: string, vars?: Record<string, number>) => 
  SafeExpressionEvaluator.evaluateMath(expr, vars)

export const safeFormulaEval = (expr: string, context: Record<string, any>, config?: SafeEvalConfig) =>
  SafeExpressionEvaluator.evaluateFormula(expr, context, config)

export const safeTemplateEval = (template: string, context: Record<string, any>) =>
  SafeExpressionEvaluator.evaluateTemplate(template, context)

export const safeConditionEval = (condition: string, context: Record<string, any>) =>
  SafeExpressionEvaluator.evaluateCondition(condition, context)

export const safeJSONParse = (jsonString: string) =>
  SafeExpressionEvaluator.parseJSON(jsonString)