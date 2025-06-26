// packages/types/src/user.ts
import type { BaseEntity } from './common'

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COMMERCIAL = 'COMMERCIAL',
  PRODUCTION = 'PRODUCTION',
  COMPTABLE = 'COMPTABLE',
  EMPLOYE = 'EMPLOYE'
}

export interface User extends BaseEntity {
  email: string
  nom: string
  prenom: string
  avatar?: string
  role: UserRole
  telephone?: string
  isActive: boolean
  lastLogin?: Date
  permissions: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
