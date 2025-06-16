// packages/types/src/client.ts
export enum ClientType {
  PARTICULIER = 'PARTICULIER',
  PROFESSIONNEL = 'PROFESSIONNEL',
  COLLECTIVITE = 'COLLECTIVITE'
}

export interface Client extends BaseEntity {
  nom: string
  type: ClientType
  siret?: string
  adresse: Address
  contact: Contact
  email: string
  telephone: string
  notes?: string
  chiffreAffaires?: number
  projetsActifs?: number
  isActif: boolean
}