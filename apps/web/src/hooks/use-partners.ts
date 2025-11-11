import type {
  CreatePartnerDto,
  Partner,
  PartnerFilters,
  PartnerGroup,
  PartnerStatistics,
  UpdatePartnerDto,
} from '@erp/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { type APIClientInterface, apiClient } from '../lib/api-client-instance'
import type { PaginatedResponse } from '../types/api-types'

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
      // Convert PartnerFilters to SearchParams
      const searchParams = filters
        ? {
            page: filters.page,
            pageSize: filters.limit,
            type: filters.type?.join(','),
            status: filters.status?.join(','),
            category: filters.category?.join(','),
            query: filters.denomination,
            // Map additional filter properties
            ...(filters.groupId && { groupId: filters.groupId }),
            ...(filters.ville && { ville: filters.ville }),
            ...(filters.codePostal && { codePostal: filters.codePostal }),
            ...(filters.email && { email: filters.email }),
            ...(filters.telephone && { telephone: filters.telephone }),
          }
        : undefined

      return typedApiClient.partners.getPartners(searchParams)
    },
  })
}

export function usePartner(id: string) {
  return useQuery<Partner | null, Error>({
    queryKey: PARTNER_KEYS?.detail(id),
    queryFn: () => typedApiClient.partners.getPartner(id),
    enabled: !!id,
  })
}

export function usePartnerComplete(id: string) {
  return useQuery<Partner | null, Error>({
    queryKey: PARTNER_KEYS?.complete(id),
    queryFn: () => typedApiClient.partners.getPartnerComplete(id),
    enabled: !!id,
  })
}

export function usePartnerStatistics() {
  return useQuery<PartnerStatistics, Error>({
    queryKey: PARTNER_KEYS?.statistics(),
    queryFn: (): Promise<PartnerStatistics> => {
      // getStatistics returns PartnerAnalytics, which needs to be mapped to PartnerStatistics
      return typedApiClient.partners.getStatistics().then((analytics) => ({
        totalPartenaires: analytics.totalClients + analytics.totalFournisseurs,
        totalClients: analytics.totalClients,
        totalFournisseurs: analytics.totalFournisseurs,
        totalProspects: 0, // Default value as not available in analytics
        partenairesActifs: analytics.totalClients + analytics.totalFournisseurs,
        partenairesInactifs: 0, // Default value as not available in analytics
        partenairesSuspendus: 0, // Default value as not available in analytics
        repartitionParCategorie: analytics.repartitionGeographique.reduce(
          (acc, item) => {
            acc[item.region] = item.count
            return acc
          },
          {} as Record<string, number>
        ),
        repartitionParGroupe: {}, // Default empty object
        top10ClientsAnciennete: analytics.topClients.map((item) => ({
          code: item.partner.code,
          denomination: item.partner.denomination,
          anciennete: 0, // Default value as not available
        })),
      }))
    },
  })
}

export function usePartnerGroups() {
  return useQuery<PartnerGroup[], Error>({
    queryKey: PARTNER_KEYS?.groups(),
    queryFn: (): Promise<PartnerGroup[]> => {
      // Implement getPartnerGroups method or use alternative
      // Since getPartnerGroups is not available, we'll return an empty array for now
      return Promise.resolve([])
    },
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
    }) => {
      const exportParams = {
        format: format.toLowerCase() as 'csv' | 'excel' | 'pdf',
        filters: filters as Record<string, unknown>,
      }
      return typedApiClient.partners.exportPartners(exportParams)
    },
    onSuccess: (result: Blob, variables) => {
      // Télécharger le fichier
      const url = URL.createObjectURL(result)
      const link = document.createElement('a')
      link.href = url
      link.download = `partners_export.${variables.format.toLowerCase()}`
      link.click()
      URL.revokeObjectURL(url)
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
    }) => {
      // Convert data array to File for the API
      const jsonString = JSON.stringify(data)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([blob], 'partners_import.json', { type: 'application/json' })

      return typedApiClient.partners.importPartners(file)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: PARTNER_KEYS.lists() })
      toast.success(`Import réussi: ${result.processed} partenaires traités`)
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} erreurs rencontrées`)
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Erreur lors de l'import")
    },
  })
}
