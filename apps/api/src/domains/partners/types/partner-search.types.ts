import type { PartnerStatus, PartnerType } from '../entities/partner.entity'

/**
 * Partner search criteria
 */
export interface PartnerSearchCriteria {
  type?: PartnerType[]
  status?: PartnerStatus[]
  category?: string[]
  groupId?: string
  denomination?: string
  ville?: string
  codePostal?: string
  email?: string
  telephone?: string
  page?: number
  limit?: number
}
