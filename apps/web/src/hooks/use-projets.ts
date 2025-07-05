/**
 * 🎯 HOOK PROJETS CORRIGÉ - TopSteel ERP
 * Hook pour la gestion des projets avec état stable
 * Fichier: apps/web/src/hooks/use-projets.ts
 */
import type { ProjetFilters } from '@/stores/projet.store'
import { useProjetStore } from '@/stores/projet.store'
import { useCallback, useEffect, useRef, useState } from 'react'

export const useProjets = (autoFetch = true) => {
  const [mounted, setMounted] = useState(false)
  const fetchInitiatedRef = useRef(false)
  
  // ✅ CORRECTION: Utiliser 'loading' au lieu de 'isLoading'
  const projets = useProjetStore((state) => state.projets) || []
  const loading = useProjetStore((state) => state.loading) || false
  const error = useProjetStore((state) => state.error)
  const filters = useProjetStore((state) => state.filters) || {}
  const fetchProjets = useProjetStore((state) => state.fetchProjets)
  const setFilters = useProjetStore((state) => state.setFilters)
  const clearError = useProjetStore((state) => state.clearError)

  const stableFetch = useCallback(async () => {
    if (fetchInitiatedRef.current || !mounted || loading) {
      return
    }

    fetchInitiatedRef.current = true
    
    try {
      await fetchProjets()
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    } finally {
      setTimeout(() => {
        if (mounted) {
          fetchInitiatedRef.current = false
        }
      }, 1000)
    }
  }, [fetchProjets, loading, mounted])

  const refetchWithFilters = useCallback(async () => {
    fetchInitiatedRef.current = false
    await stableFetch()
  }, [stableFetch])

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (mounted && autoFetch && projets.length === 0 && !loading) {
      stableFetch()
    }
  }, [mounted, autoFetch, projets.length, loading, stableFetch])

  return {
    projets: projets || [], // Toujours un tableau
    isLoading: loading, // ✅ Alias pour compatibilité
    loading, // ✅ Propriété native
    error,
    filters,
    fetchProjets: stableFetch,
    setFilters,
    clearError,
    refetch: stableFetch,
    refetchWithFilters,
  }
}

export const useProjet = (id?: string) => {
  const selectedProjet = useProjetStore((state) => state.selectedProjet)
  const loading = useProjetStore((state) => state.loading) || false
  const error = useProjetStore((state) => state.error)
  const setSelectedProjet = useProjetStore((state) => state.setSelectedProjet)
  const selectProjetById = useProjetStore((state) => state.selectProjetById)
  const clearError = useProjetStore((state) => state.clearError)

  const selectProjet = useCallback((targetId: string | undefined) => {
    if (!targetId) {
      setSelectedProjet(null)
      return
    }

    if (selectedProjet?.id === targetId) {
      return
    }

    // Utiliser selectProjetById si disponible, sinon setSelectedProjet
    if (selectProjetById) {
      selectProjetById(targetId)
    } else {
      setSelectedProjet(null)
    }
  }, [selectedProjet?.id, setSelectedProjet, selectProjetById])

  useEffect(() => {
    selectProjet(id)
  }, [id, selectProjet])

  return {
    selectedProjet,
    isLoading: loading, // ✅ Alias pour compatibilité
    loading, // ✅ Propriété native
    error,
    setSelectedProjet,
    clearError,
    data: selectedProjet,
    projet: selectedProjet,
  }
}

/**
 * Hook pour les statistiques des projets
 */
export const useProjetsStats = () => {
  const stats = useProjetStore((state) => state.stats)
  const loading = useProjetStore((state) => state.loading)
  const refreshStats = useProjetStore((state) => state.refreshStats)
  
  return {
    stats,
    loading,
    isLoading: loading,
    refreshStats
  }
}

/**
 * Hook pour la pagination des projets
 */
export const useProjetsPagination = () => {
  const currentPage = useProjetStore((state) => state.currentPage)
  const pageSize = useProjetStore((state) => state.pageSize)
  const totalCount = useProjetStore((state) => state.totalCount)
  const setPage = useProjetStore((state) => state.setPage)
  const setPageSize = useProjetStore((state) => state.setPageSize)
  
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNext = currentPage < totalPages - 1
  const hasPrev = currentPage > 0
  
  return {
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setPageSize,
    nextPage: () => hasNext && setPage(currentPage + 1),
    prevPage: () => hasPrev && setPage(currentPage - 1),
    firstPage: () => setPage(0),
    lastPage: () => setPage(totalPages - 1)
  }
}

/**
 * Hook pour les filtres et la recherche
 */
export const useProjetsFilters = () => {
  const filters = useProjetStore((state) => state.filters)
  const searchTerm = useProjetStore((state) => state.searchTerm)
  const sortBy = useProjetStore((state) => state.sortBy)
  const sortOrder = useProjetStore((state) => state.sortOrder)
  const setFilters = useProjetStore((state) => state.setFilters)
  const setSearchTerm = useProjetStore((state) => state.setSearchTerm)
  const setSorting = useProjetStore((state) => state.setSorting)
  const clearFilters = useProjetStore((state) => state.clearFilters)
  
  return {
    filters,
    searchTerm,
    sortBy,
    sortOrder,
    setFilters,
    setSearchTerm,
    setSorting,
    clearFilters,
    // Helpers
    addFilter: (key: keyof ProjetFilters, value: any) => {
      setFilters({ ...filters, [key]: value })
    },
    removeFilter: (key: keyof ProjetFilters) => {
      const newFilters = { ...filters }
      // ✅ Type-safe deletion
      if (key in newFilters) {
        const { [key]: removed, ...rest } = newFilters
        setFilters(rest)
      }
    }
  }
}

/**
 * Hook pour les actions CRUD sur les projets
 */
export const useProjetsActions = () => {
  const createProjet = useProjetStore((state) => state.createProjet)
  const updateProjet = useProjetStore((state) => state.updateProjet)
  const deleteProjet = useProjetStore((state) => state.deleteProjet)
  const duplicateProjet = useProjetStore((state) => state.duplicateProjet)
  const loading = useProjetStore((state) => state.loading)
  const error = useProjetStore((state) => state.error)
  
  return {
    createProjet,
    updateProjet,
    deleteProjet,
    duplicateProjet,
    loading,
    isLoading: loading,
    error,
    // Helpers avec gestion d'erreur
    createProjetSafe: async (data: any) => {
      try {
        return await createProjet(data)
      } catch (error) {
        console.error('Erreur création projet:', error)
        throw error
      }
    },
    updateProjetSafe: async (id: string, data: any) => {
      try {
        return await updateProjet(id, data)
      } catch (error) {
        console.error('Erreur mise à jour projet:', error)
        throw error
      }
    },
    deleteProjetSafe: async (id: string) => {
      try {
        return await deleteProjet(id)
      } catch (error) {
        console.error('Erreur suppression projet:', error)
        throw error
      }
    }
  }
}