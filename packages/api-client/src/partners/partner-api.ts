import type { AxiosInstance } from 'axios'

// Define types locally until @erp/types is available
export interface Partner {
  id: string
  name: string
  code?: string
  type?: string
  email?: string
  phone?: string
  address?: string
  active?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface PartnerGroup {
  id: string
  name: string
  description?: string
}

export interface Contact {
  id: string
  partnerId: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  position?: string
}

export interface PartnerSite {
  id: string
  partnerId: string
  name: string
  address?: string
  phone?: string
}

export interface PartnerAddress {
  id: string
  partnerId: string
  type: string
  street?: string
  city?: string
  postalCode?: string
  country?: string
}

export type CreatePartnerDto = Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>
export type UpdatePartnerDto = Partial<CreatePartnerDto>
export type CreateContactDto = Omit<Contact, 'id'>
export type UpdateContactDto = Partial<CreateContactDto>
export type CreatePartnerSiteDto = Omit<PartnerSite, 'id'>
export type UpdatePartnerSiteDto = Partial<CreatePartnerSiteDto>
export type CreatePartnerAddressDto = Omit<PartnerAddress, 'id'>
export type UpdatePartnerAddressDto = Partial<CreatePartnerAddressDto>
export type CreatePartnerGroupDto = Omit<PartnerGroup, 'id'>
export type UpdatePartnerGroupDto = Partial<CreatePartnerGroupDto>

export interface PartnerFilters {
  search?: string
  type?: string
  active?: boolean
  groupId?: string
}

export interface PartnerStatistics {
  totalPartners: number
  activePartners: number
  byType: Record<string, number>
}

export class PartnerApi {
  constructor(private readonly http: AxiosInstance) {}

  // Partners
  async createPartner(data: CreatePartnerDto): Promise<Partner> {
    const response = await this.http.post<Partner>('/business/partners', data)
    return response.data
  }

  async getPartners(filters?: PartnerFilters): Promise<Partner[]> {
    const response = await this.http.get<Partner[]>('/business/partners', { params: filters })
    return response.data
  }

  async getPartner(id: string): Promise<Partner> {
    const response = await this.http.get<Partner>(`/business/partners/${id}`)
    return response.data
  }

  async updatePartner(id: string, data: UpdatePartnerDto): Promise<Partner> {
    const response = await this.http.patch<Partner>(`/business/partners/${id}`, data)
    return response.data
  }

  async deletePartner(id: string): Promise<void> {
    await this.http.delete(`/business/partners/${id}`)
  }

  async getPartnerComplete(id: string): Promise<{
    partner: Partner
    contacts: Contact[]
    sites: PartnerSite[]
    addresses: PartnerAddress[]
    group?: PartnerGroup
  }> {
    const response = await this.http.get(`/business/partners/${id}/complete`)
    return response.data
  }

  async duplicatePartner(id: string, newCode: string): Promise<Partner> {
    const response = await this.http.post<Partner>(`/business/partners/${id}/duplicate`, {
      newCode,
    })
    return response.data
  }

  // Partner Groups
  async getPartnerGroups(): Promise<PartnerGroup[]> {
    const response = await this.http.get<PartnerGroup[]>('/business/partners/groups')
    return response.data
  }

  async createPartnerGroup(data: CreatePartnerGroupDto): Promise<PartnerGroup> {
    const response = await this.http.post<PartnerGroup>('/business/partners/groups', data)
    return response.data
  }

  async updatePartnerGroup(id: string, data: UpdatePartnerGroupDto): Promise<PartnerGroup> {
    const response = await this.http.patch<PartnerGroup>(`/business/partners/groups/${id}`, data)
    return response.data
  }

  async assignPartnerToGroup(partnerId: string, groupId: string): Promise<Partner> {
    const response = await this.http.post<Partner>(
      `/business/partners/${partnerId}/assign-group/${groupId}`
    )
    return response.data
  }

  // Contacts
  async getPartnerContacts(partnerId: string): Promise<Contact[]> {
    const response = await this.http.get<Contact[]>(`/business/partners/${partnerId}/contacts`)
    return response.data
  }

  async createContact(partnerId: string, data: CreateContactDto): Promise<Contact> {
    const response = await this.http.post<Contact>(`/business/partners/${partnerId}/contacts`, data)
    return response.data
  }

  async updateContact(contactId: string, data: UpdateContactDto): Promise<Contact> {
    const response = await this.http.patch<Contact>(
      `/business/partners/contacts/${contactId}`,
      data
    )
    return response.data
  }

  async deleteContact(contactId: string): Promise<void> {
    await this.http.delete(`/business/partners/contacts/${contactId}`)
  }

  // Sites
  async getPartnerSites(partnerId: string): Promise<PartnerSite[]> {
    const response = await this.http.get<PartnerSite[]>(`/business/partners/${partnerId}/sites`)
    return response.data
  }

  async createPartnerSite(partnerId: string, data: CreatePartnerSiteDto): Promise<PartnerSite> {
    const response = await this.http.post<PartnerSite>(
      `/business/partners/${partnerId}/sites`,
      data
    )
    return response.data
  }

  async updatePartnerSite(siteId: string, data: UpdatePartnerSiteDto): Promise<PartnerSite> {
    const response = await this.http.patch<PartnerSite>(`/business/partners/sites/${siteId}`, data)
    return response.data
  }

  async deletePartnerSite(siteId: string): Promise<void> {
    await this.http.delete(`/business/partners/sites/${siteId}`)
  }

  // Addresses
  async getPartnerAddresses(partnerId: string): Promise<PartnerAddress[]> {
    const response = await this.http.get<PartnerAddress[]>(
      `/business/partners/${partnerId}/addresses`
    )
    return response.data
  }

  async createPartnerAddress(
    partnerId: string,
    data: CreatePartnerAddressDto
  ): Promise<PartnerAddress> {
    const response = await this.http.post<PartnerAddress>(
      `/business/partners/${partnerId}/addresses`,
      data
    )
    return response.data
  }

  async updatePartnerAddress(
    addressId: string,
    data: UpdatePartnerAddressDto
  ): Promise<PartnerAddress> {
    const response = await this.http.patch<PartnerAddress>(
      `/business/partners/addresses/${addressId}`,
      data
    )
    return response.data
  }

  async deletePartnerAddress(addressId: string): Promise<void> {
    await this.http.delete(`/business/partners/addresses/${addressId}`)
  }

  // Business operations
  async convertProspect(partnerId: string): Promise<Partner> {
    const response = await this.http.post<Partner>(
      `/business/partners/${partnerId}/convertir-prospect`
    )
    return response.data
  }

  async suspendPartner(partnerId: string, raison: string): Promise<Partner> {
    const response = await this.http.post<Partner>(`/business/partners/${partnerId}/suspendre`, {
      raison,
    })
    return response.data
  }

  async mergePartners(principalId: string, secondaireId: string): Promise<Partner> {
    const response = await this.http.post<Partner>(
      `/business/partners/${principalId}/fusionner/${secondaireId}`
    )
    return response.data
  }

  // Statistics
  async getStatistics(): Promise<PartnerStatistics> {
    const response = await this.http.get<PartnerStatistics>('/business/partners/stats/overview')
    return response.data
  }

  // Lists
  async getClientsActifs(): Promise<Partner[]> {
    const response = await this.http.get<Partner[]>('/business/partners/clients/actifs')
    return response.data
  }

  async getFournisseursActifs(): Promise<Partner[]> {
    const response = await this.http.get<Partner[]>('/business/partners/fournisseurs/actifs')
    return response.data
  }

  // Export/Import
  async exportPartners(
    format: 'CSV' | 'EXCEL' | 'PDF',
    filters?: Record<string, any>
  ): Promise<{
    url: string
    filename: string
  }> {
    const response = await this.http.post('/business/partners/export', { format, filters })
    return response.data
  }

  async importPartners(
    data: Record<string, any>[],
    options?: { skipErrors?: boolean; dryRun?: boolean }
  ): Promise<{
    imported: number
    errors: number
    warnings: string[]
    details: Record<string, any>[]
  }> {
    const response = await this.http.post('/business/partners/import', { data, options })
    return response.data
  }
}
