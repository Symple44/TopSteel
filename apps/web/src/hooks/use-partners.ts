import type {
  CreatePartnerDto,
  Partner,
  PartnerFilters,
  PartnerStatistics,
  UpdatePartnerDto,
} from '@erp/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient, type APIClientInterface } from '@/lib/api-client-instance'
import type { PaginatedResponse } from '@/types/api-types'

// Type the apiClient properly
const typedApiClient = apiClient as APIClientInterface

// Query keys
const PARTNER_KEYS = {
  all: ['partners'] as const,
  lists: () => [...PARTNER_KEYS.all, 'list'] as const,
  list: (filters?: PartnerFilters) => [...PARTNER_KEYS.lists(), filters] as const,
  details: () => [...PARTNER_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PARTNER_KEYS.details(), id] as const,
  complete: (id: string) => [...PARTNER_KEYS.detail(id), 'complete'] as const,
  statistics: () => [...PARTNER_KEYS.all, 'statistics'] as const,
  groups: () => [...PARTNER_KEYS.all, 'groups'] as const,
  clientsActifs: () => [...PARTNER_KEYS.all, 'clients-actifs'] as const,
  fournisseursActifs: () => [...PARTNER_KEYS.all, 'fournisseurs-actifs'] as const,
}

// Hooks pour les partenaires
export function usePartners(filters?: PartnerFilters) {
  return useQuery<PaginatedResponse<Partner>, Error>({
    queryKey: PARTNER_KEYS?.list(filters),
    queryFn: (): Promise<PaginatedResponse<Partner>> => {
      return typedApiClient.partners.getPartners(filters)
    },
  })
}

export function usePartner(id: string) {
  return useQuery<Partner, Error>({
    queryKey: PARTNER_KEYS?.detail(id),
    queryFn: () => typedApiClient.partners.getPartner(id),
    enabled: !!id,
  })
}

export function usePartnerComplete(id: string) {
  return useQuery<Partner, Error>({
    queryKey: PARTNER_KEYS?.complete(id),
    queryFn: () => typedApiClient.partners.getPartnerComplete(id),
    enabled: !!id,
  })
}

export function usePartnerStatistics() {
  return useQuery<PartnerStatistics, Error>({
    queryKey: PARTNER_KEYS?.statistics(),
    queryFn: (): Promise<PartnerStatistics> => {
      return typedApiClient.partners.getStatistics()
    },
  })
}

export function usePartnerGroups() {
  return useQuery({
    queryKey: PARTNER_KEYS?.groups(),
    queryFn: () => typedApiClient.partners.getPartnerGroups(),
  })
}

export function useClientsActifs() {
  return useQuery({
    queryKey: PARTNER_KEYS?.clientsActifs(),
    queryFn: () => typedApiClient.partners.getClientsActifs(),
  })
}

export function useFournisseursActifs() {
  return useQuery({
    queryKey: PARTNER_KEYS?.fournisseursActifs(),
    queryFn: () => typedApiClient.partners.getFournisseursActifs(),
  })
}

// Mutations
export function useCreatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePartnerDto) => typedApiClient.partners.createPartner(data),
    onSuccess: (partner: Partner) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      queryClient.setQueryData(PARTNER_KEYS.detail(partner.id), partner)
      toast.success('Partenaire créé avec succès')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du partenaire')
    },
  })
}

export function useUpdatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerDto }) =>
      typedApiClient.partners.updatePartner(id, data),
    onSuccess: (partner: Partner) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      queryClient.setQueryData(PARTNER_KEYS.detail(partner.id), partner)
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.complete(partner.id) })
      toast.success('Partenaire mis à jour avec succès')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du partenaire')
    },
  })
}

export function useDeletePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => typedApiClient.partners.deletePartner(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      queryClient.removeQueries({ queryKey: PARTNER_KEYS.detail(id) })
      toast.success('Partenaire supprimé avec succès')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du partenaire')
    },
  })
}

export function useDuplicatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newCode }: { id: string; newCode: string }) =>
      typedApiClient.partners.duplicatePartner(id, newCode),
    onSuccess: (partner: Partner) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      toast.success(`Partenaire dupliqué avec succès (${partner.code})`)
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication du partenaire')
    },
  })
}

export function useConvertProspect() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => typedApiClient.partners.convertProspect(id),
    onSuccess: (partner: Partner) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      queryClient.setQueryData(PARTNER_KEYS.detail(partner.id), partner)
      toast.success('Prospect converti en client avec succès')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la conversion du prospect')
    },
  })
}

export function useSuspendPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, raison }: { id: string; raison: string }) =>
      typedApiClient.partners.suspendPartner(id, raison),
    onSuccess: (partner: Partner) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      queryClient.setQueryData(PARTNER_KEYS.detail(partner.id), partner)
      toast.success('Partenaire suspendu')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suspension du partenaire')
    },
  })
}

export function useMergePartners() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ principalId, secondaireId }: { principalId: string; secondaireId: string }) =>
      typedApiClient.partners.mergePartners(principalId, secondaireId),
    onSuccess: (partner: Partner) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      queryClient.setQueryData(PARTNER_KEYS.detail(partner.id), partner)
      toast.success('Partenaires fusionnés avec succès')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la fusion des partenaires')
    },
  })
}

export function useAssignPartnerToGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, groupId }: { partnerId: string; groupId: string }) =>
      typedApiClient.partners.assignPartnerToGroup(partnerId, groupId),
    onSuccess: (partner: Partner) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      queryClient.setQueryData(PARTNER_KEYS.detail(partner.id), partner)
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.complete(partner.id) })
      toast.success('Groupe assigné au partenaire')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'assignation du groupe")
    },
  })
}

// Export/Import
export function useExportPartners() {
  return useMutation({
    mutationFn: ({
      format,
      filters,
    }: {
      format: 'CSV' | 'EXCEL' | 'PDF'
      filters?: Record<string, unknown>
    }) => typedApiClient.partners.exportPartners(format, filters),
    onSuccess: (result) => {
      // Télécharger le fichier
      const link = document.createElement('a')
      link.href = result.url
      link.download = result.filename
      link.click()
      toast.success('Export réussi')
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'export")
    },
  })
}

export function useImportPartners() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      data,
      options,
    }: {
      data: Record<string, unknown>[]
      options?: { skipErrors?: boolean; dryRun?: boolean }
    }) => typedApiClient.partners.importPartners(data, options),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      toast.success(`Import réussi: ${result.imported} partenaires importés`)
      if (result.errors > 0) {
        toast.warning(`${result.errors} erreurs rencontrées`)
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'import")
    },
  })
}
