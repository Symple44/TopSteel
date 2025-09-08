import type {
  CreateContactDto,
  CreatePartnerAddressDto,
  CreatePartnerGroupDto,
  CreatePartnerSiteDto,
  UpdateContactDto,
  UpdatePartnerAddressDto,
  UpdatePartnerGroupDto,
  UpdatePartnerSiteDto,
} from '@erp/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client-instance'

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
    queryKey: CONTACT_KEYS?.byPartner(partnerId),
    queryFn: () => (apiClient as unknown)?.partners?.getPartnerContacts(partnerId),
    enabled: !!partnerId,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: CreateContactDto }) =>
      (apiClient as unknown)?.partners?.createContact(partnerId, data),
    onSuccess: (_contact, { partnerId }) => {
      queryClient?.invalidateQueries({ queryKey: CONTACT_KEYS?.byPartner(partnerId) })
      queryClient?.invalidateQueries({ queryKey: ['partners', 'detail', partnerId, 'complete'] })
      toast?.success('Contact créé avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la création du contact')
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactDto }) =>
      (apiClient as unknown)?.partners?.updateContact(id, data),
    onSuccess: (contact: unknown) => {
      queryClient?.invalidateQueries({ queryKey: CONTACT_KEYS.all })
      queryClient?.setQueryData(CONTACT_KEYS?.detail(contact.id), contact)
      toast?.success('Contact mis à jour avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la mise à jour du contact')
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => (apiClient as unknown)?.partners?.deleteContact(id),
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: CONTACT_KEYS.all })
      toast?.success('Contact supprimé avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la suppression du contact')
    },
  })
}

// ========== SITES ==========

export function usePartnerSites(partnerId: string) {
  return useQuery({
    queryKey: SITE_KEYS?.byPartner(partnerId),
    queryFn: () => (apiClient as unknown)?.partners?.getPartnerSites(partnerId),
    enabled: !!partnerId,
  })
}

export function useCreatePartnerSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: CreatePartnerSiteDto }) =>
      (apiClient as unknown)?.partners?.createPartnerSite(partnerId, data),
    onSuccess: (_site, { partnerId }) => {
      queryClient?.invalidateQueries({ queryKey: SITE_KEYS?.byPartner(partnerId) })
      queryClient?.invalidateQueries({ queryKey: ['partners', 'detail', partnerId, 'complete'] })
      toast?.success('Site créé avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la création du site')
    },
  })
}

export function useUpdatePartnerSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerSiteDto }) =>
      (apiClient as unknown)?.partners?.updatePartnerSite(id, data),
    onSuccess: (site: unknown) => {
      queryClient?.invalidateQueries({ queryKey: SITE_KEYS.all })
      queryClient?.setQueryData(SITE_KEYS?.detail(site.id), site)
      toast?.success('Site mis à jour avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la mise à jour du site')
    },
  })
}

export function useDeletePartnerSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => (apiClient as unknown)?.partners?.deletePartnerSite(id),
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: SITE_KEYS.all })
      toast?.success('Site supprimé avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la suppression du site')
    },
  })
}

// ========== ADDRESSES ==========

export function usePartnerAddresses(partnerId: string) {
  return useQuery({
    queryKey: ADDRESS_KEYS?.byPartner(partnerId),
    queryFn: () => (apiClient as unknown)?.partners?.getPartnerAddresses(partnerId),
    enabled: !!partnerId,
  })
}

export function useCreatePartnerAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: string; data: CreatePartnerAddressDto }) =>
      (apiClient as unknown)?.partners?.createPartnerAddress(partnerId, data),
    onSuccess: (_address, { partnerId }) => {
      queryClient?.invalidateQueries({ queryKey: ADDRESS_KEYS?.byPartner(partnerId) })
      queryClient?.invalidateQueries({ queryKey: ['partners', 'detail', partnerId, 'complete'] })
      toast?.success('Adresse créée avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || "Erreur lors de la création de l'adresse")
    },
  })
}

export function useUpdatePartnerAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerAddressDto }) =>
      (apiClient as unknown)?.partners?.updatePartnerAddress(id, data),
    onSuccess: (address: unknown) => {
      queryClient?.invalidateQueries({ queryKey: ADDRESS_KEYS.all })
      queryClient?.setQueryData(ADDRESS_KEYS?.detail(address.id), address)
      toast?.success('Adresse mise à jour avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || "Erreur lors de la mise à jour de l'adresse")
    },
  })
}

export function useDeletePartnerAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => (apiClient as unknown)?.partners?.deletePartnerAddress(id),
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: ADDRESS_KEYS.all })
      toast?.success('Adresse supprimée avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || "Erreur lors de la suppression de l'adresse")
    },
  })
}

// ========== GROUPS ==========

export function useCreatePartnerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePartnerGroupDto) =>
      (apiClient as unknown)?.partners?.createPartnerGroup(data),
    onSuccess: (group: unknown) => {
      queryClient?.invalidateQueries({ queryKey: GROUP_KEYS?.list() })
      queryClient?.setQueryData(GROUP_KEYS?.detail(group.id), group)
      toast?.success('Groupe créé avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la création du groupe')
    },
  })
}

export function useUpdatePartnerGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerGroupDto }) =>
      (apiClient as unknown)?.partners?.updatePartnerGroup(id, data),
    onSuccess: (group: unknown) => {
      queryClient?.invalidateQueries({ queryKey: GROUP_KEYS?.list() })
      queryClient?.setQueryData(GROUP_KEYS?.detail(group.id), group)
      toast?.success('Groupe mis à jour avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la mise à jour du groupe')
    },
  })
}
