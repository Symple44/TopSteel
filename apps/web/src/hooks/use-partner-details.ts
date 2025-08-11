import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  Contact,
  CreateContactDto,
  CreatePartnerAddressDto,
  CreatePartnerGroupDto,
  CreatePartnerSiteDto,
  PartnerAddress,
  PartnerGroup,
  PartnerSite,
  UpdateContactDto,
  UpdatePartnerAddressDto,
  UpdatePartnerGroupDto,
  UpdatePartnerSiteDto,
} from '@erp/types'
import { apiClient } from '@/lib/api-client'

// Query keys
const CONTACT_KEYS = {
  all: ['contacts'] as const,
  byPartner: (partnerId: string) => [...CONTACT_KEYS.all, 'partner', partnerId] as const,
  detail: (id: string) => [...CONTACT_KEYS.all, id] as const,
}

const SITE_KEYS = {
  all: ['sites'] as const,
  byPartner: (partnerId: string) => [...SITE_KEYS.all, 'partner', partnerId] as const,
  detail: (id: string) => [...SITE_KEYS.all, id] as const,
}

const ADDRESS_KEYS = {
  all: ['addresses'] as const,
  byPartner: (partnerId: string) => [...ADDRESS_KEYS.all, 'partner', partnerId] as const,
  detail: (id: string) => [...ADDRESS_KEYS.all, id] as const,
}

const GROUP_KEYS = {
  all: ['partner-groups'] as const,
  list: () => [...GROUP_KEYS.all, 'list'] as const,
  detail: (id: string) => [...GROUP_KEYS.all, id] as const,
}

// ========== CONTACTS ==========

export function usePartnerContacts(partnerId: string) {
  return useQuery({
    queryKey: CONTACT_KEYS.byPartner(partnerId),
    queryFn: () => apiClient.partners.getPartnerContacts(partnerId),
    enabled: !!partnerId,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: CreateContactDto }) =>
      apiClient.partners.createContact(partnerId, data),
    onSuccess: (contact, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: CONTACT_KEYS.byPartner(partnerId) })
      queryClient.invalidateQueries({ queryKey: ['partners', 'detail', partnerId, 'complete'] })
      toast.success('Contact créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du contact')
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      apiClient.partners.updateContact(id, data),
    onSuccess: (contact) => {
      queryClient.invalidateQueries({ queryKey: CONTACT_KEYS.all })
      queryClient.setQueryData(CONTACT_KEYS.detail(contact.id), contact)
      toast.success('Contact mis à jour avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du contact')
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.partners.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_KEYS.all })
      toast.success('Contact supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du contact')
    },
  })
}

// ========== SITES ==========

export function usePartnerSites(partnerId: string) {
  return useQuery({
    queryKey: SITE_KEYS.byPartner(partnerId),
    queryFn: () => apiClient.partners.getPartnerSites(partnerId),
    enabled: !!partnerId,
  })
}

export function useCreatePartnerSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: CreatePartnerSiteDto }) =>
      apiClient.partners.createPartnerSite(partnerId, data),
    onSuccess: (site, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.byPartner(partnerId) })
      queryClient.invalidateQueries({ queryKey: ['partners', 'detail', partnerId, 'complete'] })
      toast.success('Site créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du site')
    },
  })
}

export function useUpdatePartnerSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerSiteDto }) =>
      apiClient.partners.updatePartnerSite(id, data),
    onSuccess: (site) => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.all })
      queryClient.setQueryData(SITE_KEYS.detail(site.id), site)
      toast.success('Site mis à jour avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du site')
    },
  })
}

export function useDeletePartnerSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.partners.deletePartnerSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_KEYS.all })
      toast.success('Site supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du site')
    },
  })
}

// ========== ADDRESSES ==========

export function usePartnerAddresses(partnerId: string) {
  return useQuery({
    queryKey: ADDRESS_KEYS.byPartner(partnerId),
    queryFn: () => apiClient.partners.getPartnerAddresses(partnerId),
    enabled: !!partnerId,
  })
}

export function useCreatePartnerAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: CreatePartnerAddressDto }) =>
      apiClient.partners.createPartnerAddress(partnerId, data),
    onSuccess: (address, { partnerId }) => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.byPartner(partnerId) })
      queryClient.invalidateQueries({ queryKey: ['partners', 'detail', partnerId, 'complete'] })
      toast.success('Adresse créée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de la création de l'adresse")
    },
  })
}

export function useUpdatePartnerAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerAddressDto }) =>
      apiClient.partners.updatePartnerAddress(id, data),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all })
      queryClient.setQueryData(ADDRESS_KEYS.detail(address.id), address)
      toast.success('Adresse mise à jour avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour de l'adresse")
    },
  })
}

export function useDeletePartnerAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.partners.deletePartnerAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all })
      toast.success('Adresse supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression de l'adresse")
    },
  })
}

// ========== GROUPS ==========

export function useCreatePartnerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePartnerGroupDto) => apiClient.partners.createPartnerGroup(data),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.list() })
      queryClient.setQueryData(GROUP_KEYS.detail(group.id), group)
      toast.success('Groupe créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du groupe')
    },
  })
}

export function useUpdatePartnerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerGroupDto }) =>
      apiClient.partners.updatePartnerGroup(id, data),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.list() })
      queryClient.setQueryData(GROUP_KEYS.detail(group.id), group)
      toast.success('Groupe mis à jour avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du groupe')
    },
  })
}