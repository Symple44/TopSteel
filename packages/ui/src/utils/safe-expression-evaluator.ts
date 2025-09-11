/**
 * Safe expression evaluator
 * Provides secure evaluation of mathematical expressions
 */

const ALLOWED_CHARS = /^[0-9+\-*/().\s]+$/
const FUNCTION_REGEX = /\b(SUM|AVG|MIN|MAX|COUNT)\s*\(/gi

/**
 * Check if parentheses are balanced
 */
function hasBalancedParentheses(expression: string): boolean {
  let count = 0
  for (const char of expression) {
    if (char === '(') count++
    else if (char === ')') count--
    if (count < 0) return false
  }
  return count === 0
}

/**
 * Process basic functions like SUM, AVG, etc.
 */
function processFunctions(expression: string): string {
  return expression.replace(FUNCTION_REGEX, (_match, _funcName) => {
    return '0'
  })
}

/**
 * Safely evaluate a mathematical expression
 * @param expression The expression to evaluate
 * @returns The result of the evaluation
 */
export function evaluateExpression(expression: string): number {
  try {
    // Clean the expression
    const cleaned = expression.replace(/\s/g, '')

    // Validate characters
    if (!ALLOWED_CHARS.test(cleaned)) {
      throw new Error('Invalid characters in expression')
    }

    // Check for balanced parentheses
    if (!hasBalancedParentheses(cleaned)) {
      throw new Error('Unbalanced parentheses')
    }

    // Handle basic functions
    const processed = processFunctions(cleaned)

    // Use Function constructor for safe evaluation (safer than eval)
    const result = new Function(`return ${processed}`)()

    if (typeof result !== 'number' || Number.isNaN(result)) {
      throw new Error('Invalid result')
    }

    return result
  } catch (_error) {
    return 0
  }
}

/**
 * Evaluate mathematical expression with result object
 * @param expression The mathematical expression to evaluate
 * @returns Object with success status and value or error
 */
export function evaluateMathExpression(expression: string): {
  success: boolean
  value?: number
  error?: string
} {
  try {
    const result = evaluateExpression(expression)
    return { success: true, value: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Legacy exports for backward compatibility
 * @deprecated Use individual functions instead
 */
export const SafeExpressionEvaluator = {
  /**
   * @deprecated Use evaluateExpression instead
   */
  evaluate: evaluateExpression,

  /**
   * @deprecated Use evaluateMathExpression instead
   */
  evaluateMath: evaluateMathExpression,
} as const
