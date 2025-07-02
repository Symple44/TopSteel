// apps/web/src/hooks/use-projets.ts - VERSION CORRIGÉE
import { useProjetStore } from '@/stores/projet.store'
import { useCallback, useEffect, useRef } from 'react'
import { shallow } from 'zustand/shallow'

export const useProjets = (autoFetch = true) => {
  const fetchedRef = useRef(false)
  
  const store = useProjetStore(
    (state) => ({
      projets: state.projets,
      isLoading: state.isLoading,
      error: state.error,
      filters: state.filters,
      fetchProjets: state.fetchProjets,
      setFilters: state.setFilters,
      clearError: state.clearError,
    }),
    shallow
  )

  // ✅ FIX: Stabilisation avec useCallback + ref pour éviter les boucles
  const stableFetchProjets = useCallback(async () => {
    if (!fetchedRef.current && !store.isLoading && store.projets.length === 0) {
      fetchedRef.current = true
      await store.fetchProjets()
    }
  }, [store.fetchProjets, store.isLoading, store.projets.length])

  useEffect(() => {
    if (autoFetch) {
      stableFetchProjets()
    }
  }, [autoFetch, stableFetchProjets])

  // ✅ Reset ref when projets are loaded or filters change
  useEffect(() => {
    if (store.projets.length > 0) {
      fetchedRef.current = false
    }
  }, [store.filters])

  return store
}

export const useProjet = (id?: string) => {
  const store = useProjetStore(
    (state) => ({
      selectedProjet: state.selectedProjet,
      isLoading: state.isLoading,
      error: state.error,
      setSelectedProjet: state.setSelectedProjet,
      clearError: state.clearError,
    }),
    shallow
  )

  // ✅ FIX: Auto-load projet when ID changes (stable)
  const stableSetProjet = useCallback(() => {
    if (id && (!store.selectedProjet || store.selectedProjet.id !== id)) {
      // Logique pour charger le projet si nécessaire
      store.setSelectedProjet(null) // Reset pendant le chargement
    }
  }, [id, store.selectedProjet?.id, store.setSelectedProjet])

  useEffect(() => {
    stableSetProjet()
  }, [stableSetProjet])

  return {
    ...store,
    data: store.selectedProjet,
    projet: store.selectedProjet,
  }
}