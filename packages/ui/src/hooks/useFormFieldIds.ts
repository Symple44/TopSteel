import { useId } from 'react'

/**
 * Hook to generate unique IDs for form fields in a predictable and type-safe way
 *
 * @example
 * const ids = useFormFieldIds(['name', 'email', 'phone'])
 * // Returns: { name: 'field-123-name', email: 'field-123-email', phone: 'field-123-phone' }
 *
 * @param fields - Array of field names
 * @returns Record with field names as keys and unique IDs as values
 */
export function useFormFieldIds<T extends string>(fields: T[]): Record<T, string> {
  const baseId = useId()

  return fields.reduce(
    (acc, field) => {
      acc[field] = `field-${baseId}-${field}`
      return acc
    },
    {} as Record<T, string>
  )
}

/**
 * Hook to generate a single unique ID with an optional prefix
 *
 * @example
 * const id = useUniqueId('search-input')
 * // Returns: 'search-input-123'
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function useUniqueId(prefix?: string): string {
  const id = useId()
  return prefix ? `${prefix}-${id}` : id
}

/**
 * Hook for radio group fields that need multiple related IDs
 *
 * @example
 * const radioIds = useRadioGroupIds('contact', ['primary', 'secondary'])
 * // Returns: { primary: 'contact-123-primary', secondary: 'contact-123-secondary' }
 *
 * @param groupName - Name of the radio group
 * @param options - Array of radio option values
 * @returns Record with option values as keys and unique IDs as values
 */
export function useRadioGroupIds<T extends string>(
  groupName: string,
  options: T[]
): Record<T, string> {
  const baseId = useId()

  return options.reduce(
    (acc, option) => {
      acc[option] = `${groupName}-${baseId}-${option}`
      return acc
    },
    {} as Record<T, string>
  )
}

/**
 * Hook for checkbox group fields
 *
 * @example
 * const checkboxIds = useCheckboxGroupIds('features', ['feature1', 'feature2'])
 * // Returns: { feature1: 'features-123-feature1', feature2: 'features-123-feature2' }
 *
 * @param groupName - Name of the checkbox group
 * @param options - Array of checkbox option values
 * @returns Record with option values as keys and unique IDs as values
 */
export function useCheckboxGroupIds<T extends string>(
  groupName: string,
  options: T[]
): Record<T, string> {
  const baseId = useId()

  return options.reduce(
    (acc, option) => {
      acc[option] = `${groupName}-${baseId}-${option}`
      return acc
    },
    {} as Record<T, string>
  )
}
