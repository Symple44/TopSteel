import type {
  CreatePartnerDto,
  Partner,
  PartnerFilters,
  PartnerStatistics,
  UpdatePartnerDto,
} from '@erp/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client-instance'
import type { PaginatedResponse } from '@/types/api-types'

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
    queryFn: async (): Promise<PaginatedResponse<Partner>> => {
      const result = await (apiClient as unknown)?.partners?.getPartners(filters)
      return result as PaginatedResponse<Partner>
    },
  })
}

export function usePartner(id: string) {
  return useQuery<Partner, Error>({
    queryKey: PARTNER_KEYS?.detail(id),
    queryFn: () => (apiClient as unknown)?.partners?.getPartner(id),
    enabled: !!id,
  })
}

export function usePartnerComplete(id: string) {
  return useQuery<Partner, Error>({
    queryKey: PARTNER_KEYS?.complete(id),
    queryFn: () => (apiClient as unknown)?.partners?.getPartnerComplete(id),
    enabled: !!id,
  })
}

export function usePartnerStatistics() {
  return useQuery<PartnerStatistics, Error>({
    queryKey: PARTNER_KEYS?.statistics(),
    queryFn: async (): Promise<PartnerStatistics> => {
      const result = await (apiClient as unknown)?.partners?.getStatistics()
      return result as PartnerStatistics
    },
  })
}

export function usePartnerGroups() {
  return useQuery({
    queryKey: PARTNER_KEYS?.groups(),
    queryFn: () => (apiClient as unknown)?.partners?.getPartnerGroups(),
  })
}

export function useClientsActifs() {
  return useQuery({
    queryKey: PARTNER_KEYS?.clientsActifs(),
    queryFn: () => (apiClient as unknown)?.partners?.getClientsActifs(),
  })
}

export function useFournisseursActifs() {
  return useQuery({
    queryKey: PARTNER_KEYS?.fournisseursActifs(),
    queryFn: () => (apiClient as unknown)?.partners?.getFournisseursActifs(),
  })
}

// Mutations
export function useCreatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePartnerDto) => (apiClient as unknown)?.partners?.createPartner(data),
    onSuccess: (partner: unknown) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      queryClient?.setQueryData(PARTNER_KEYS?.detail(partner.id), partner)
      toast?.success('Partenaire créé avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la création du partenaire')
    },
  })
}

export function useUpdatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerDto }) =>
      (apiClient as unknown)?.partners?.updatePartner(id, data),
    onSuccess: (partner: unknown) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      queryClient?.setQueryData(PARTNER_KEYS?.detail(partner.id), partner)
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.complete(partner.id) })
      toast?.success('Partenaire mis à jour avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la mise à jour du partenaire')
    },
  })
}

export function useDeletePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => (apiClient as unknown)?.partners?.deletePartner(id),
    onSuccess: (_, id) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      queryClient?.removeQueries({ queryKey: PARTNER_KEYS?.detail(id) })
      toast?.success('Partenaire supprimé avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la suppression du partenaire')
    },
  })
}

export function useDuplicatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newCode }: { id: string; newCode: string }) =>
      (apiClient as unknown)?.partners?.duplicatePartner(id, newCode),
    onSuccess: (partner: unknown) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      toast?.success(`Partenaire dupliqué avec succès (${partner.code})`)
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la duplication du partenaire')
    },
  })
}

export function useConvertProspect() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => (apiClient as unknown)?.partners?.convertProspect(id),
    onSuccess: (partner: unknown) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      queryClient?.setQueryData(PARTNER_KEYS?.detail(partner.id), partner)
      toast?.success('Prospect converti en client avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la conversion du prospect')
    },
  })
}

export function useSuspendPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, raison }: { id: string; raison: string }) =>
      (apiClient as unknown)?.partners?.suspendPartner(id, raison),
    onSuccess: (partner: unknown) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      queryClient?.setQueryData(PARTNER_KEYS?.detail(partner.id), partner)
      toast?.success('Partenaire suspendu')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la suspension du partenaire')
    },
  })
}

export function useMergePartners() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ principalId, secondaireId }: { principalId: string; secondaireId: string }) =>
      (apiClient as unknown)?.partners?.mergePartners(principalId, secondaireId),
    onSuccess: (partner: unknown) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      queryClient?.setQueryData(PARTNER_KEYS?.detail(partner.id), partner)
      toast?.success('Partenaires fusionnés avec succès')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || 'Erreur lors de la fusion des partenaires')
    },
  })
}

export function useAssignPartnerToGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ partnerId, groupId }: { partnerId: string; groupId: string }) =>
      (apiClient as unknown)?.partners?.assignPartnerToGroup(partnerId, groupId),
    onSuccess: (partner: unknown) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      queryClient?.setQueryData(PARTNER_KEYS?.detail(partner.id), partner)
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.complete(partner.id) })
      toast?.success('Groupe assigné au partenaire')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || "Erreur lors de l'assignation du groupe")
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
    }) => apiClient.partners?.exportPartners(format, filters),
    onSuccess: (result) => {
      // Télécharger le fichier
      const link = document.createElement('a')
      link.href = result.url
      link.download = result.filename
      link.click()
      toast?.success('Export réussi')
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || "Erreur lors de l'export")
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
    }) => apiClient.partners?.importPartners(data, options),
    onSuccess: (result) => {
      queryClient?.invalidateQueries({ queryKey: PARTNER_KEYS?.lists() })
      toast?.success(`Import réussi: ${result.imported} partenaires importés`)
      if (result.errors > 0) {
        toast?.warning(`${result.errors} erreurs rencontrées`)
      }
    },
    onError: (error: unknown) => {
      toast?.error(error.response?.data?.message || "Erreur lors de l'import")
    },
  })
}
