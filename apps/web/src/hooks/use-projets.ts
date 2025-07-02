// apps/web/src/hooks/use-projets.ts - VERSION STABLE
import { useProjetStore } from '@/stores/projet.store'
import { useCallback, useEffect, useRef, useState } from 'react'

export const useProjets = (autoFetch = true) => {
  const [mounted, setMounted] = useState(false)
  const fetchInitiatedRef = useRef(false)
  
  // Sélecteur stable sans shallow (évite getSnapshot loop)
  const projets = useProjetStore((state) => state.projets) || []
  const isLoading = useProjetStore((state) => state.isLoading) || false
  const error = useProjetStore((state) => state.error)
  const filters = useProjetStore((state) => state.filters) || {}
  const fetchProjets = useProjetStore((state) => state.fetchProjets)
  const setFilters = useProjetStore((state) => state.setFilters)
  const clearError = useProjetStore((state) => state.clearError)

  const stableFetch = useCallback(async () => {
    if (fetchInitiatedRef.current || !mounted || isLoading) {
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
  }, [fetchProjets, isLoading, mounted])

  const refetchWithFilters = useCallback(async () => {
    fetchInitiatedRef.current = false
    await stableFetch()
  }, [stableFetch])

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (mounted && autoFetch && projets.length === 0 && !isLoading) {
      stableFetch()
    }
  }, [mounted, autoFetch, projets.length, isLoading, stableFetch])

  return {
    projets: projets || [], // Toujours un tableau
    isLoading,
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
  const isLoading = useProjetStore((state) => state.isLoading) || false
  const error = useProjetStore((state) => state.error)
  const setSelectedProjet = useProjetStore((state) => state.setSelectedProjet)
  const clearError = useProjetStore((state) => state.clearError)

  const selectProjet = useCallback((targetId: string | undefined) => {
    if (!targetId) {
      setSelectedProjet(null)
      return
    }

    if (selectedProjet?.id === targetId) {
      return
    }

    setSelectedProjet(null)
  }, [selectedProjet?.id, setSelectedProjet])

  useEffect(() => {
    selectProjet(id)
  }, [id, selectProjet])

  return {
    selectedProjet,
    isLoading,
    error,
    setSelectedProjet,
    clearError,
    data: selectedProjet,
    projet: selectedProjet,
  }
}
