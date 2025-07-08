// packages/utils/src/validation/security-helpers.ts
// Fonctions utilitaires pour la validation de sécurité

/**
 * Vérifie une clé modulo 97 (utilisé pour IBAN, etc.)
 */
export function verifierCleModulo97(value: string): boolean {
  if (!value || value.length < 4) return false

  // Remplacer les lettres par des chiffres (A=10, B=11, ..., Z=35)
  const numericValue = value.replace(/[A-Z]/g, (letter) => {
    return (letter.charCodeAt(0) - 65 + 10).toString()
  })

  // Calculer le modulo 97
  let remainder = 0
  for (const char of numericValue) {
    remainder = (remainder * 10 + Number.parseInt(char)) % 97
  }

  return remainder === 1
}

/**
 * Vérifie si un domaine est dans la liste noire
 */
export function estDomaineBlackliste(domain: string): boolean {
  // Liste des domaines suspects/temporaires
  const domainesBlacklistes = [
    'tempmail.org',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'yopmail.com',
    'temp-mail.org',
    'throwaway.email',
    'sharklasers.com',
    'guerrillamail.info',
    'grr.la',
    'guerrillamail.biz',
    'guerrillamail.org',
    'guerrillamail.de',
    'guerrillamail.net',
    'guerrillamail.com',
    'spam4.me',
    'maildrop.cc',
    'mailnesia.com',
  ]

  const normalizedDomain = domain.toLowerCase().trim()
  return domainesBlacklistes.includes(normalizedDomain)
}

/**
 * Vérifie si un mot de passe est dans la liste des mots de passe communs
 */
export function motDePasseCommun(password: string): boolean {
  // Liste des mots de passe les plus communs
  const motsDePasseCommuns = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'login',
    'qwerty123',
    'solo',
    'passw0rd',
    'starwars',
    'hello',
    'freedom',
    'whatever',
    'qazwsx',
    'trustno1',
    'jordan23',
    'harley',
    'password1',
    'robert',
    '12345',
    '1234',
    '12345678',
    'qwertyuiop',
    '1q2w3e4r',
    'azerty',
    'iloveyou',
    'princess',
    'rockyou',
    '000000',
    '111111',
    '123123',
    'sunshine',
    'football',
    'charlie',
    '1234567',
    '654321',
    'superman',
    'michael',
    'computer',
    'michelle',
    'jesus',
    'soccer',
    'ninja',
    'mustang',
    'summer',
    'batman',
    'shadow',
    'pepper',
    'flower',
    'lovely',
    'hello123',
    'hottie',
    'andrew',
    'cheese',
    '696969',
    'michelle',
    'basketball',
    'thunder',
    'soccer',
    'fuckyou',
    'aaaaaa',
  ]

  const normalizedPassword = password.toLowerCase().trim()
  return motsDePasseCommuns.includes(normalizedPassword)
}

/**
 * Vérifie la force d'un mot de passe
 */
export function evaluerForceMotDePasse(password: string): {
  score: number
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0

  // Longueur minimum
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Le mot de passe doit contenir au moins 8 caractères')
  }

  // Contient des minuscules
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Le mot de passe doit contenir au moins une lettre minuscule')
  }

  // Contient des majuscules
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Le mot de passe doit contenir au moins une lettre majuscule')
  }

  // Contient des chiffres
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Le mot de passe doit contenir au moins un chiffre')
  }

  // Contient des caractères spéciaux
  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1
  } else {
    feedback.push('Le mot de passe doit contenir au moins un caractère spécial')
  }

  // Vérifie s'il est dans la liste des mots de passe communs
  if (motDePasseCommun(password)) {
    score -= 2
    feedback.push('Ce mot de passe est trop commun')
  }

  // Longueur bonus
  if (password.length >= 12) {
    score += 1
  }

  const isStrong = score >= 4 && feedback.length === 0

  return {
    score: Math.max(0, score),
    feedback,
    isStrong,
  }
}

/**
 * Nettoie et valide un numéro de téléphone français
 */
export function nettoyerTelephoneFrancais(telephone: string): string | null {
  // Supprimer tous les caractères non numériques sauf le +
  const cleaned = telephone.replace(/[^\d+]/g, '')

  // Patterns acceptés
  const patterns = [
    /^\+33[1-9]\d{8}$/, // +33XXXXXXXXX
    /^0[1-9]\d{8}$/, // 0XXXXXXXXX
    /^[1-9]\d{8}$/, // XXXXXXXXX
  ]

  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      // Normaliser au format +33
      if (cleaned.startsWith('0')) {
        return '+33' + cleaned.substring(1)
      } else if (cleaned.startsWith('+33')) {
        return cleaned
      } else if (cleaned.length === 9) {
        return '+33' + cleaned
      }
    }
  }

  return null
}

/**
 * Valide un code postal français
 */
export function validerCodePostalFrancais(codePostal: string): boolean {
  return /^\d{5}$/.test(codePostal)
}

/**
 * Valide un numéro SIRET
 */
export function validerSIRET(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) return false

  // Algorithme de Luhn modifié pour SIRET
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const digit = Number.parseInt(siret[i] || '0')
    if (i % 2 === 0) {
      sum += digit
    } else {
      const doubled = digit * 2
      sum += doubled > 9 ? doubled - 9 : doubled
    }
  }

  return sum % 10 === 0
}
