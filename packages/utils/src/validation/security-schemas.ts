// packages/utils/src/validation/security-schemas.ts
// Correction des erreurs TypeScript

import { z } from "zod";
import {
  estDomaineBlackliste,
  evaluerForceMotDePasse,
  motDePasseCommun,
  nettoyerTelephoneFrancais,
  validerCodePostalFrancais,
  validerSIRET,
} from "./security-helpers";

// Schéma pour la validation des emails avec vérification de domaine
export const emailSecuriseSchema = z
  .string()
  .email("Format email invalide")
  .refine((email) => {
    const domain = email.split("@")[1];
    return !estDomaineBlackliste(domain);
  }, "Domaine email non autorisé")
  .refine((email) => {
    return !motDePasseCommun(email.split("@")[0]);
  }, "Nom d'utilisateur trop commun");

// Schéma pour la validation des mots de passe sécurisés
export const motDePasseSecuriseSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .refine((password) => {
    const evaluation = evaluerForceMotDePasse(password);
    return evaluation.isStrong;
  }, "Le mot de passe n'est pas assez fort");

// Schéma pour la validation des numéros de téléphone français
export const telephoneFrancaisSchema = z
  .string()
  .refine((phone) => {
    return nettoyerTelephoneFrancais(phone) !== null;
  }, "Numéro de téléphone français invalide")
  .transform((phone) => nettoyerTelephoneFrancais(phone) as string);

// Schéma pour la validation des codes postaux français
export const codePostalFrancaisSchema = z
  .string()
  .refine(validerCodePostalFrancais, "Code postal français invalide");

// Schéma pour la validation des numéros SIRET
export const siretSchema = z
  .string()
  .refine(validerSIRET, "Numéro SIRET invalide");

// Schéma pour la validation des données utilisateur sécurisées
export const utilisateurSecuriseSchema = z.object({
  email: emailSecuriseSchema,
  motDePasse: motDePasseSecuriseSchema,
  telephone: telephoneFrancaisSchema.optional(),
  codePostal: codePostalFrancaisSchema.optional(),
});

// Schéma pour la validation des données entreprise
export const entrepriseSecuriseSchema = z.object({
  nom: z.string().min(2, "Nom de l'entreprise trop court"),
  siret: siretSchema.optional(),
  email: emailSecuriseSchema,
  telephone: telephoneFrancaisSchema.optional(),
  adresse: z.object({
    rue: z.string().min(5, "Adresse trop courte"),
    codePostal: codePostalFrancaisSchema,
    ville: z.string().min(2, "Nom de ville trop court"),
  }),
});

// Types exportés
export type EmailSecurise = z.infer<typeof emailSecuriseSchema>;
export type MotDePasseSecurise = z.infer<typeof motDePasseSecuriseSchema>;
export type TelephoneFrancais = z.infer<typeof telephoneFrancaisSchema>;
export type CodePostalFrancais = z.infer<typeof codePostalFrancaisSchema>;
export type UtilisateurSecurise = z.infer<typeof utilisateurSecuriseSchema>;
export type EntrepriseSecurise = z.infer<typeof entrepriseSecuriseSchema>;

