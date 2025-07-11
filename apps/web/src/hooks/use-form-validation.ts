// apps/web/src/hooks/use-form-validation.ts
import { useState } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => string | null
  message?: {
    required?: string
    minLength?: string
    maxLength?: string
    pattern?: string
  }
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule>>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = (field: keyof T, value: unknown): string => {
    const rule = validationRules[field]
    if (!rule) return ''

    // Required
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rule.message?.required || `${String(field)} est requis`
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return (
          rule.message?.minLength ||
          `${String(field)} doit contenir au moins ${rule.minLength} caractères`
        )
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        return (
          rule.message?.maxLength ||
          `${String(field)} ne peut pas dépasser ${rule.maxLength} caractères`
        )
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message?.pattern || `${String(field)} n'est pas au bon format`
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) return customError
    }

    return ''
  }

  const handleChange =
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value
      setValues((prev) => ({ ...prev, [field]: value }))

      // Validation en temps réel si touché
      if (touched[field]) {
        const error = validateField(field, value)
        setErrors((prev) => ({ ...prev, [field]: error }))
      }
    }

  const handleBlur = (field: keyof T) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = validateField(field, values[field])
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    const newTouched: Partial<Record<keyof T, boolean>> = {}

    Object.keys(validationRules).forEach((field) => {
      const key = field as keyof T
      newTouched[key] = true
      const error = validateField(key, values[key])
      if (error) newErrors[key] = error
    })

    setErrors(newErrors)
    setTouched(newTouched)
    return Object.keys(newErrors).length === 0
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).some((key) => errors[key as keyof T]),
  }
}

// Exemple d'usage:
/*
const { values, errors, handleChange, handleBlur, validateAll } = useFormValidation(
  { email: '', password: '' },
  { 
    email: { 
      required: true, 
      pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      message: { required: 'Email requis', pattern: 'Email invalide' }
    },
    password: { 
      required: true, 
      minLength: 8,
      message: { required: 'Mot de passe requis', minLength: 'Au moins 8 caractères' }
    }
  }
)
*/
