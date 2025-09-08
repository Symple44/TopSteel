export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: unknown) => string | null
  }
}

export interface FormSchema {
  fields: FormField[]
  submitLabel?: string
  resetLabel?: string
}
