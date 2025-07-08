// packages/utils/src/lib/validators.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // Format français
  const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/
  return phoneRegex.test(phone)
}

export function validateCNPJ(cnpj: string): boolean {
  // Validation CNPJ brésilien simplifié
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/
  return cnpjRegex.test(cnpj)
}
