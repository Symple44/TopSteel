/**
 * 🛡️  HOOK DE VALIDATION SÉCURISÉE
 */
import { useCallback, useState } from 'react'

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

/**
 * Utilitaires de sécurité simplifiés (sans dépendance externe)
 */
class SimpleSecurityUtils {
  /**
   * Validation d'email simple mais sécurisée
   */
  static validateEmailSecure(email: string): boolean {
    // Pattern email basique mais robuste
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!emailPattern.test(email)) {
      return false
    }

    // Vérifier la longueur
    if (email.length > 254) {
      return false
    }

    // Vérifier les domaines suspects
    const suspiciousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com']
    const domain = email.split('@')[1]?.toLowerCase()

    if (domain && suspiciousDomains.includes(domain)) {
      return false
    }

    return true
  }

  /**
   * Nettoyage HTML simple
   */
  static sanitizeHtml(input: string): string {
    // Suppression des balises dangereuses
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Supprimer les event handlers
      .replace(/javascript:/gi, '')
      .trim()
  }

  /**
   * Nettoyage de chaîne générique
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>'"&]/g, '') // Supprimer les caractères dangereux
      .trim()
      .substring(0, 1000) // Limiter la longueur
  }
}

export function useSecureValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validate = useCallback(
    (data: Record<string, string>): boolean => {
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
            if (!SimpleSecurityUtils.validateEmailSecure(value)) {
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
    },
    [rules]
  )

  const sanitizeInput = useCallback((value: string): string => {
    return SimpleSecurityUtils.sanitizeString(value)
  }, [])

  const sanitizeHtml = useCallback((value: string): string => {
    return SimpleSecurityUtils.sanitizeHtml(value)
  }, [])

  return {
    errors,
    validate,
    sanitizeInput,
    sanitizeHtml,
    hasErrors: Object.keys(errors).length > 0,
    getFieldErrors: (field: string) => errors[field] || [],
    clearErrors: () => setErrors({}),
    clearFieldError: (field: string) => {
      setErrors((prev) => {
        const newErrors = { ...prev }

        delete newErrors[field]

        return newErrors
      })
    },
  }
}

/**
 * Hook spécialisé pour la validation de formulaires
 */
export function useFormSecureValidation() {
  return useSecureValidation({
    email: {
      required: true,
      email: true,
      maxLength: 254,
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 128,
      custom: (value: string) => {
        const hasLower = /[a-z]/.test(value)
        const hasUpper = /[A-Z]/.test(value)
        const hasNumber = /\d/.test(value)
        const hasSpecial = /[^a-zA-Z\d]/.test(value)

        if (!hasLower) return 'Doit contenir une minuscule'
        if (!hasUpper) return 'Doit contenir une majuscule'
        if (!hasNumber) return 'Doit contenir un chiffre'
        if (!hasSpecial) return 'Doit contenir un caractère spécial'

        return null
      },
    },
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    phone: {
      pattern: /^(\+33|0)[1-9](\d{8})$/,
      custom: (value: string) => {
        if (value && !value.match(/^(\+33|0)[1-9](\d{8})$/)) {
          return 'Format de téléphone français invalide'
        }

        return null
      },
    },
  })
}
