/**
 * 👤 ENTITÉS MÉTIER - DOMAINE USER
 * Logique métier pure pour les utilisateurs
 */

import type { BaseEntity } from '../../base'

// ===== ENUMS MÉTIER =====

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  TECHNICIEN = 'TECHNICIEN',
  COMMERCIAL = 'COMMERCIAL',
  COMPTABLE = 'COMPTABLE',
  VIEWER = 'VIEWER',
}

export enum UserStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  EN_ATTENTE = 'EN_ATTENTE',
}

export enum Competence {
  SOUDURE = 'SOUDURE',
  DECOUPE = 'DECOUPE',
  ASSEMBLAGE = 'ASSEMBLAGE',
  FINITION = 'FINITION',
  CONTROLE_QUALITE = 'CONTROLE_QUALITE',
  CONCEPTION = 'CONCEPTION',
  GESTION_PROJET = 'GESTION_PROJET',
  COMMERCIAL = 'COMMERCIAL',
  COMPTABILITE = 'COMPTABILITE',
}

// ===== VALUE OBJECTS =====

export interface UserProfile {
  readonly nom: string
  readonly prenom: string
  readonly telephone?: string
  readonly avatar?: string
  readonly dateNaissance?: Date
  readonly adresse?: {
    rue: string
    ville: string
    codePostal: string
    pays: string
  }
}

export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'auto'
  readonly langue: 'fr' | 'en'
  readonly notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  readonly dashboard: {
    widgets: string[]
    layout: 'grid' | 'list'
  }
}

export interface UserSecurity {
  readonly lastLogin?: Date
  readonly lastPasswordChange?: Date
  readonly failedLoginAttempts: number
  readonly isLocked: boolean
  readonly lockoutUntil?: Date
  readonly twoFactorEnabled: boolean
}

// ===== ENTITÉ PRINCIPALE =====

export interface User extends BaseEntity {
  // Identité
  readonly email: string
  readonly profile: UserProfile

  // Autorisation
  readonly role: UserRole
  readonly permissions: string[]
  readonly statut: UserStatut

  // Métier
  readonly competences: Competence[]
  readonly departement?: string
  readonly manager?: string
  readonly tauxHoraire?: number

  // Personnalisation
  readonly preferences: UserPreferences
  readonly security: UserSecurity

  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy?: string
}

// ===== AGRÉGATS =====

export interface UserStats {
  readonly total: number
  readonly actifs: number
  readonly parRole: Record<UserRole, number>
  readonly parDepartement: Record<string, number>
  readonly nouveauxCeMois: number
}

export interface UserWithActivity extends User {
  readonly activite: {
    dernierLogin: Date
    heuresTravaillees: number
    projetsActifs: number
    tachesEnCours: number
    performanceScore: number
  }
}
