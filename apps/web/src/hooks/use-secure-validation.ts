/**
 * 🛡️  HOOK DE VALIDATION SÉCURISÉE
 */
import { useState, useCallback } from 'react'
import { SecurityUtils } from './security-enhanced'

interface ValidationRule {
  required?: boolean
  email?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string[]
}

export function useSecureValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validate = useCallback((data: Record<string, string>): boolean => {
    const newErrors: ValidationErrors = {}

    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field] || ''
      const fieldErrors: string[] = []

      // Required
      if (rule.required && !value.trim()) {
        fieldErrors.push('Ce champ est requis')
      }

      if (value) {
        // Email
        if (rule.email) {
          if (!SecurityUtils.validateEmailSecure(value)) {
            fieldErrors.push('Email invalide ou non autorisé')
          }
        }

        // Length
        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(`Minimum ${rule.minLength} caractères`)
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(`Maximum ${rule.maxLength} caractères`)
        }

        // Pattern
        if (rule.pattern && !rule.pattern.test(value)) {
          fieldErrors.push('Format invalide')
        }

        // Custom validation
        if (rule.custom) {
          const customError = rule.custom(value)
          if (customError) {
            fieldErrors.push(customError)
          }
        }
      }

      if (fieldErrors.length > 0) {
        newErrors[field] = fieldErrors
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [rules])

  const sanitizeInput = useCallback((value: string): string => {
    return SecurityUtils.sanitizeHtml(value)
  }, [])

  return {
    errors,
    validate,
    sanitizeInput,
    hasErrors: Object.keys(errors).length > 0,
    getFieldErrors: (field: string) => errors[field] || []
  }
}
