import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@/store'
import { projetsService } from '@/services/projets.service'
import { Projet, ProjetFilters } from '@/types'
import { toast } from '@/components/ui/use-toast'

// Query keys
const PROJETS_QUERY_KEY = 'projets'
const PROJET_QUERY_KEY = 'projet'

// Hook pour récupérer la liste des projets
export function useProjets(filters?: ProjetFilters) {
  const setLoadingProjets = useStore((state) => state.setLoadingProjets)
  
  return useQuery({
    queryKey: [PROJETS_QUERY_KEY, filters],
    queryFn: () => projetsService.getAll(filters),
    onSettled: () => setLoadingProjets(false),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook pour récupérer un projet par ID
export function useProjet(id: string) {
  return useQuery({
    queryKey: [PROJET_QUERY_KEY, id],
    queryFn: () => projetsService.getById(id),
    enabled: !!id,
  })
}

// Hook pour créer un projet
export function useCreateProjet() {
  const queryClient = useQueryClient()
  const addProjet = useStore((state) => state.addProjet)

  return useMutation({
    mutationFn: projetsService.create,
    onSuccess: (newProjet) => {
      queryClient.invalidateQueries({ queryKey: [PROJETS_QUERY_KEY] })
      addProjet(newProjet)
      toast({
        title: 'Projet créé',
        description: `Le projet ${newProjet.reference} a été créé avec succès.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la création du projet.',
        variant: 'destructive',
      })
    },
  })
}

// Hook pour mettre à jour un projet
export function useUpdateProjet() {
  const queryClient = useQueryClient()
  const updateProjet = useStore((state) => state.updateProjet)

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      projetsService.update(id, data),
    onSuccess: (updatedProjet) => {
      queryClient.invalidateQueries({ queryKey: [PROJETS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [PROJET_QUERY_KEY, updatedProjet.id] })
      updateProjet(updatedProjet.id, updatedProjet)
      toast({
        title: 'Projet mis à jour',
        description: 'Les modifications ont été enregistrées.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour.',
        variant: 'destructive',
      })
    },
  })
}

// Hook pour supprimer un projet
export function useDeleteProjet() {
  const queryClient = useQueryClient()
  const deleteProjet = useStore((state) => state.deleteProjet)

  return useMutation({
    mutationFn: projetsService.delete,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [PROJETS_QUERY_KEY] })
      deleteProjet(deletedId)
      toast({
        title: 'Projet supprimé',
        description: 'Le projet a été supprimé définitivement.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      })
    },
  })
}

// Hook pour dupliquer un projet
export function useDuplicateProjet() {
  const queryClient = useQueryClient()
  const addProjet = useStore((state) => state.addProjet)

  return useMutation({
    mutationFn: projetsService.duplicate,
    onSuccess: (newProjet) => {
      queryClient.invalidateQueries({ queryKey: [PROJETS_QUERY_KEY] })
      addProjet(newProjet)
      toast({
        title: 'Projet dupliqué',
        description: `Le projet a été dupliqué sous la référence ${newProjet.reference}.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la duplication.',
        variant: 'destructive',
      })
    },
  })
}

// Hook pour les devis d'un projet
export function useProjetDevis(projetId: string) {
  return useQuery({
    queryKey: ['projet-devis', projetId],
    queryFn: () => projetsService.getDevis(projetId),
    enabled: !!projetId,
  })
}

// Hook pour créer un devis
export function useCreateDevis(projetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => projetsService.createDevis(projetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projet-devis', projetId] })
      queryClient.invalidateQueries({ queryKey: [PROJET_QUERY_KEY, projetId] })
      toast({
        title: 'Devis créé',
        description: 'Le devis a été créé avec succès.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la création du devis.',
        variant: 'destructive',
      })
    },
  })
}

// Hook pour envoyer un devis par email
export function useSendDevis() {
  return useMutation({
    mutationFn: ({ projetId, devisId, email }: { projetId: string; devisId: string; email: string }) =>
      projetsService.sendDevis(projetId, devisId, email),
    onSuccess: () => {
      toast({
        title: 'Devis envoyé',
        description: 'Le devis a été envoyé par email avec succès.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || "Une erreur est survenue lors de l'envoi du devis.",
        variant: 'destructive',
      })
    },
  })
}

// Hook pour les documents d'un projet
export function useProjetDocuments(projetId: string) {
  return useQuery({
    queryKey: ['projet-documents', projetId],
    queryFn: () => projetsService.getDocuments(projetId),
    enabled: !!projetId,
  })
}

// Hook pour uploader un document
export function useUploadDocument(projetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, type, onProgress }: { file: File; type: string; onProgress?: (progress: number) => void }) =>
      projetsService.uploadDocument(projetId, file, type, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projet-documents', projetId] })
      toast({
        title: 'Document uploadé',
        description: 'Le document a été ajouté au projet.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || "Une erreur est survenue lors de l'upload.",
        variant: 'destructive',
      })
    },
  })
}

// Hook pour les statistiques des projets
export function useProjetsStatistics() {
  return useQuery({
    queryKey: ['projets-statistics'],
    queryFn: projetsService.getStatistics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}