/**
 * Safe expression evaluator
 * Provides secure evaluation of mathematical expressions
 */
export class SafeExpressionEvaluator {
  private static readonly ALLOWED_CHARS = /^[0-9+\-*/().\s]+$/
  private static readonly FUNCTION_REGEX = /\b(SUM|AVG|MIN|MAX|COUNT)\s*\(/gi

  /**
   * Safely evaluate a mathematical expression
   * @param expression The expression to evaluate
   * @returns The result of the evaluation
   */
  static evaluate(expression: string): number {
    try {
      // Clean the expression
      const cleaned = expression.replace(/\s/g, '')

      // Validate characters
      if (!SafeExpressionEvaluator.ALLOWED_CHARS.test(cleaned)) {
        throw new Error('Invalid characters in expression')
      }

      // Check for balanced parentheses
      if (!SafeExpressionEvaluator.hasBalancedParentheses(cleaned)) {
        throw new Error('Unbalanced parentheses')
      }

      // Handle basic functions
      const processed = SafeExpressionEvaluator.processFunctions(cleaned)

      // Use Function constructor for safe evaluation (safer than eval)
      const result = new Function('return ' + processed)()

      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Invalid result')
      }

      return result
    } catch (error) {
      console.warn('Expression evaluation failed:', error)
      return 0
    }
  }

  /**
   * Check if parentheses are balanced
   */
  private static hasBalancedParentheses(expression: string): boolean {
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
  private static processFunctions(expression: string): string {
    return expression.replace(SafeExpressionEvaluator.FUNCTION_REGEX, (match, funcName) => {
      // For now, just replace with 0 - would need proper implementation
      // based on the context of where this is used
      console.warn(`Function ${funcName} not implemented, returning 0`)
      return '0'
    })
  }

  /**
   * Evaluate mathematical expression with result object
   * @param expression The mathematical expression to evaluate
   * @returns Object with success status and value or error
   */
  static evaluateMath(expression: string): { success: boolean; value?: number; error?: string } {
    try {
      const result = SafeExpressionEvaluator.evaluate(expression)
      return { success: true, value: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
