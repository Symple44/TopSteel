import { SafeExpressionEvaluator } from './safe-expression-evaluator'

/**
 * Safe mathematical expression evaluator
 * Only allows numbers and basic math operations
 */
export function safeMathEval(expression: string): number {
  // Remove all whitespace
  const cleaned = expression.replace(/\s/g, '')

  // Validate the expression contains only allowed characters
  // Numbers, decimal points, and math operators: + - * / ( )
  if (!/^[0-9+\-*/().\s]+$/.test(cleaned)) {
    throw new Error('Invalid characters in expression')
  }

  // Check for balanced parentheses
  let parenCount = 0
  for (const char of cleaned) {
    if (char === '(') parenCount++
    if (char === ')') parenCount--
    if (parenCount < 0) throw new Error('Unbalanced parentheses')
  }
  if (parenCount !== 0) throw new Error('Unbalanced parentheses')

  // Prevent dangerous patterns
  if (/(\d+\.){2,}/.test(cleaned)) {
    throw new Error('Invalid number format')
  }

  // Use SafeExpressionEvaluator instead of Function constructor
  const result = SafeExpressionEvaluator.evaluateMath(cleaned)
  
  if (!result.success) {
    throw new Error(result.error || 'Invalid mathematical expression')
  }

  if (typeof result.value !== 'number' || !Number.isFinite(result.value)) {
    throw new Error('Invalid result')
  }

  return result.value
}
