// packages/utils/src/validation/index.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/
  return phoneRegex.test(phone)
}

export function isValidSiret(siret: string): boolean {
  const siretRegex = /^\d{14}$/
  return siretRegex.test(siret)
}
