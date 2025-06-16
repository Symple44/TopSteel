// packages/utils/src/validation/schemas.ts
import { z } from 'zod'

export const emailSchema = z
  .string()
  .email('Email invalide')
  .min(1, 'Email requis')

export const phoneSchema = z
  .string()
  .regex(/^(?:\+33|0)[1-9](?:[0-9]{8})$/, 'Numéro de téléphone invalide')
  .optional()

export const siretSchema = z
  .string()
  .regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)')
  .optional()

export const codePostalSchema = z
  .string()
  .regex(/^\d{5}$/, 'Code postal invalide')

export const addressSchema = z.object({
  rue: z.string().min(1, 'Rue requise'),
  codePostal: codePostalSchema,
  ville: z.string().min(1, 'Ville requise'),
  pays: z.string().optional().default('France'),
  complement: z.string().optional()
})

export const contactSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().optional(),
  telephone: phoneSchema,
  email: emailSchema.optional(),
  fonction: z.string().optional()
})

// Schémas métier
export const projetSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  type: z.enum(['PORTAIL', 'CLOTURE', 'ESCALIER', 'RAMPE', 'VERRIERE', 'STRUCTURE', 'AUTRE']),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  adresseChantier: addressSchema,
  notes: z.string().optional()
}).refine((data) => {
  if (data.dateDebut && data.dateFin) {
    return new Date(data.dateDebut) <= new Date(data.dateFin)
  }
  return true
}, {
  message: "La date de fin doit être après la date de début",
  path: ["dateFin"]
})

export const stockSchema = z.object({
  reference: z.string().min(1, 'Référence requise'),
  designation: z.string().min(1, 'Désignation requise'),
  description: z.string().optional(),
  type: z.enum(['MATIERE_PREMIERE', 'PRODUIT_FINI', 'CONSOMMABLE', 'OUTILLAGE']),
  quantiteStock: z.number().min(0, 'Quantité positive requise'),
  quantiteMin: z.number().min(0, 'Quantité minimale positive requise'),
  quantiteMax: z.number().min(0, 'Quantité maximale positive requise'),
  unite: z.enum(['ml', 'kg', 'piece', 'm2', 'm3', 'heure']),
  prixAchat: z.number().min(0, 'Prix positif requis'),
  prixVente: z.number().min(0, 'Prix positif requis').optional(),
  fournisseur: z.string().min(1, 'Fournisseur requis'),
  emplacement: z.string().min(1, 'Emplacement requis')
}).refine((data) => data.quantiteMax >= data.quantiteMin, {
  message: "La quantité maximale doit être supérieure à la quantité minimale",
  path: ["quantiteMax"]
})