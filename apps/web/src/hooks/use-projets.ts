/**
 * 🎯 HOOK PROJETS CORRIGÉ - TopSteel ERP
 * Hook pour la gestion des projets avec accès sécurisé aux propriétés
 * Fichier: apps/web/src/hooks/use-projets.ts
 */
import { useProjetStore } from '@/stores/projet.store'
import type { ProjetFilters } from '@erp/types'
import { useCallback, useEffect, useRef, useState } from 'react'

export const _useProjets = (autoFetch = true) => {
  const [mounted, setMounted] = useState(false)
  const _fetchInitiatedRef = useRef(false)
  
  // ✅ CORRECTION: Accès sécurisé aux propriétés avec fallbacks
  const _projets = useProjetStore((state) => state.projets || [])
  const _loading = useProjetStore((state) => (state as any).loading || false)
  const _error = useProjetStore((state) => (state as any).error || null)
  const _filters = useProjetStore((state) => state.filters || {})
  const _fetchProjets = useProjetStore((state) => state.fetchProjets)
  const _setFilters = useProjetStore((state) => state.setFilters)
  const _clearError = useProjetStore((state) => (state as any).clearError)

  const _stableFetch = useCallback(async () => {
    if (fetchInitiatedRef.current || !mounted || loading) {
      return
    }

    fetchInitiatedRef.current = true
    
    try {
      if (fetchProjets) {
        await fetchProjets()
      }
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

  const _refetchWithFilters = useCallback(async () => {
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
    projets,
    isLoading: loading, // ✅ Alias pour compatibilité
    loading, // ✅ Propriété native
    error,
    filters,
    fetchProjets: stableFetch,
    setFilters,
    clearError: clearError || (() => {}),
    refetch: stableFetch,
    refetchWithFilters,
  }
}

export const _useProjet = (id?: string) => {
  const _selectedProjet = useProjetStore((state) => state.selectedProjet)
  const _loading = useProjetStore((state) => (state as any).loading || false)
  const _error = useProjetStore((state) => (state as any).error || null)
  const _setSelectedProjet = useProjetStore((state) => state.setSelectedProjet)
  const _selectProjetById = useProjetStore((state) => state.selectProjetById)
  const _clearError = useProjetStore((state) => (state as any).clearError)

  const _selectProjet = useCallback((targetId: string | undefined) => {
    if (!targetId) {
      setSelectedProjet?.(null)

      return
    }

    if (selectedProjet?.id === targetId) {
      return
    }

    // Utiliser selectProjetById si disponible, sinon setSelectedProjet
    if (selectProjetById) {
      selectProjetById(targetId)
    } else if (setSelectedProjet) {
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
    clearError: clearError || (() => {}),
    data: selectedProjet,
    projet: selectedProjet,
  }
}

/**
 * Hook pour les statistiques des projets
 */
export const _useProjetsStats = () => {
  const _stats = useProjetStore((state) => state.stats)
  const _loading = useProjetStore((state) => (state as any).loading || false)
  const _refreshStats = useProjetStore((state) => state.refreshStats)
  
  return {
    stats,
    loading,
    isLoading: loading,
    refreshStats: refreshStats || (() => {})
  }
}

/**
 * Hook pour la pagination des projets
 */
export const _useProjetsPagination = () => {
  const _currentPage = useProjetStore((state) => state.currentPage || 0)
  const _pageSize = useProjetStore((state) => state.pageSize || 20)
  const _totalCount = useProjetStore((state) => state.totalCount || 0)
  const _setPage = useProjetStore((state) => state.setPage)
  const _setPageSize = useProjetStore((state) => state.setPageSize)
  
  const _totalPages = Math.ceil(totalCount / pageSize)
  const _hasNext = currentPage < totalPages - 1
  const _hasPrev = currentPage > 0
  
  return {
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    hasNext,
    hasPrev,
    setPage: setPage || (() => {}),
    setPageSize: setPageSize || (() => {}),
    nextPage: () => hasNext && setPage?.(currentPage + 1),
    prevPage: () => hasPrev && setPage?.(currentPage - 1),
    firstPage: () => setPage?.(0),
    lastPage: () => setPage?.(totalPages - 1)
  }
}

/**
 * Hook pour les filtres et la recherche
 */
export const _useProjetsFilters = () => {
  const _filters = useProjetStore((state) => state.filters || {})
  const _searchTerm = useProjetStore((state) => state.searchTerm || '')
  const _sortBy = useProjetStore((state) => state.sortBy)
  const _sortOrder = useProjetStore((state) => state.sortOrder)
  const _setFilters = useProjetStore((state) => state.setFilters)
  const _setSearchTerm = useProjetStore((state) => state.setSearchTerm)
  const _setSorting = useProjetStore((state) => state.setSorting)
  const _clearFilters = useProjetStore((state) => state.clearFilters)
  
  return {
    filters,
    searchTerm,
    sortBy,
    sortOrder,
    setFilters: setFilters || (() => {}),
    setSearchTerm: setSearchTerm || (() => {}),
    setSorting: setSorting || (() => {}),
    clearFilters: clearFilters || (() => {}),
    // Helpers
    addFilter: (key: keyof ProjetFilters, value: unknown) => {
      setFilters?.({ ...filters, [key]: value })
    },
    removeFilter: (key: keyof ProjetFilters) => {
      const _newFilters = { ...filters }

      // ✅ Type-safe deletion
      if (key in newFilters) {
        const { [key]: removed, ...rest } = newFilters

        setFilters?.(rest)
      }
    }
  }
}

/**
 * Hook pour les actions CRUD sur les projets
 */
export const _useProjetsActions = () => {
  const _createProjet = useProjetStore((state) => state.createProjet)
  const _updateProjet = useProjetStore((state) => state.updateProjet)
  const _deleteProjet = useProjetStore((state) => state.deleteProjet)
  const _duplicateProjet = useProjetStore((state) => state.duplicateProjet)
  const _loading = useProjetStore((state) => (state as any).loading || false)
  const _error = useProjetStore((state) => (state as any).error || null)
  
  return {
    createProjet,
    updateProjet,
    deleteProjet,
    duplicateProjet,
    loading,
    isLoading: loading,
    error,
    // Helpers avec gestion d'erreur
    createProjetSafe: async (data: unknown) => {
      try {
        return await createProjet?.(data)
      } catch (error) {
        console.error('Erreur création projet:', error)
        throw error
      }
    },
    updateProjetSafe: async (id: string, data: unknown) => {
      try {
        return await updateProjet?.(id, data)
      } catch (error) {
        console.error('Erreur mise à jour projet:', error)
        throw error
      }
    },
    deleteProjetSafe: async (id: string) => {
      try {
        return await deleteProjet?.(id)
      } catch (error) {
        console.error('Erreur suppression projet:', error)
        throw error
      }
    }
  }
}
