/**
 * Types pour les entités Société
 * Créé pour résoudre les erreurs TypeScript TS18046
 */

export enum SocieteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export interface SiteData {
  id: string
  nom: string
  code: string
  adresse?: string
  ville?: string
  codePostal?: string
  pays?: string
  isPrincipal?: boolean
  societeId: string
}

export interface SocieteData {
  id: string
  nom: string
  code: string
  status: SocieteStatus
  email?: string
  telephone?: string
  adresse?: string
  ville?: string
  codePostal?: string
  pays?: string
  siret?: string
  tva?: string
  sites?: SiteData[]
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface SocieteFiltered extends SocieteData {
  // Pour les filtres dans les contrôleurs
  userCount?: number
  siteCount?: number
  isActive?: boolean
}

export interface SocieteWithRelations extends SocieteData {
  users?: UserSocieteRelation[]
  sites: SiteData[]
  license?: SocieteLicense
}

export interface UserSocieteRelation {
  userId: string
  societeId: string
  roleId: string
  isDefault: boolean
  isActive: boolean
  permissions?: string[]
  createdAt?: Date | string
}

export interface SocieteLicense {
  id: string
  societeId: string
  type: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
  expiresAt: Date | string
  maxUsers: number
  maxSites: number
  features: string[]
}
