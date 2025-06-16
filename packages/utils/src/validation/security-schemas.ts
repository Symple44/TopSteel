// packages/utils/src/validation/security-schemas.ts
import { z } from 'zod'

// Schémas de sécurité renforcés
export const securiteSchemas = {
  // Validation XSS
  nettoyerTexte: z.string()
    .transform(val => val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''))
    .transform(val => val.replace(/javascript:/gi, ''))
    .transform(val => val.replace(/on\w+\s*=/gi, '')),

  // Validation SIRET renforcée
  siretSecurise: z.string()
    .regex(/^\d{14}$/, 'SIRET invalide')
    .refine(async (siret) => {
      // Vérification de la clé de Luhn
      return verifierCleModulo97(siret)
    }, 'SIRET invalide selon l\'algorithme de contrôle'),

  // Email avec vérification de domaine
  emailSecurise: z.string()
    .email('Email invalide')
    .refine(async (email) => {
      const domain = email.split('@')[1]
      return !await estDomaineBlackliste(domain)
    }, 'Domaine email non autorisé'),

  // Mot de passe renforcé
  motDePasseSecurise: z.string()
    .min(12, 'Minimum 12 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Doit contenir majuscule, minuscule, chiffre et caractère spécial')
    .refine(val => !motDePasseCommun.includes(val.toLowerCase()), 
            'Mot de passe trop commun'),
}