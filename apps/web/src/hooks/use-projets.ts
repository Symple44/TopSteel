// apps/web/src/hooks/use-projets.ts - VERSION CORRIGÉE SANS BOUCLES
import { useProjetStore } from '@/stores/projet.store'
import { useCallback, useEffect, useRef } from 'react'
import { shallow } from 'zustand/shallow'

export const useProjets = (autoFetch = true) => {
  // ✅ FIX CRITIQUE #1: Ref pour éviter les refetch multiples
  const fetchInitiatedRef = useRef(false)
  const mountedRef = useRef(true)
  
  // ✅ FIX CRITIQUE #2: Sélecteur optimisé avec shallow
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

  // ✅ FIX CRITIQUE #3: Stabilisation des fonctions avec useCallback
  const initializeProjets = useCallback(async () => {
    // Éviter fetch multiple et conditions de course
    if (
      fetchInitiatedRef.current || 
      store.isLoading || 
      store.projets.length > 0 ||
      !mountedRef.current
    ) {
      return
    }

    fetchInitiatedRef.current = true
    
    try {
      await store.fetchProjets()
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    } finally {
      // Reset après délai pour permettre retry si nécessaire
      setTimeout(() => {
        if (mountedRef.current) {
          fetchInitiatedRef.current = false
        }
      }, 1000)
    }
  }, [store.fetchProjets, store.isLoading, store.projets.length])

  // ✅ FIX CRITIQUE #4: useEffect optimisé avec cleanup
  useEffect(() => {
    if (autoFetch) {
      initializeProjets()
    }

    return () => {
      mountedRef.current = false
    }
  }, [autoFetch, initializeProjets])

  // ✅ FIX CRITIQUE #5: Reset fetch state quand filtres changent
  useEffect(() => {
    const filtersChanged = Object.keys(store.filters).length > 0
    if (filtersChanged && store.projets.length > 0) {
      fetchInitiatedRef.current = false
    }
  }, [store.filters])

  // ✅ Méthode pour refetch manuel stable
  const refetch = useCallback(async () => {
    fetchInitiatedRef.current = false
    await initializeProjets()
  }, [initializeProjets])

  return {
    ...store,
    refetch,
  }
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

  // ✅ FIX CRITIQUE #6: Stabilisation sélection projet
  const selectProjet = useCallback((targetId: string | undefined) => {
    if (!targetId) {
      store.setSelectedProjet(null)
      return
    }

    // Éviter les re-sélections inutiles
    if (store.selectedProjet?.id === targetId) {
      return
    }

    store.setSelectedProjet(null) // Reset pendant chargement
    // Logique de chargement du projet spécifique si nécessaire
  }, [store.selectedProjet?.id, store.setSelectedProjet])

  // ✅ Effect stabilisé pour auto-sélection
  useEffect(() => {
    selectProjet(id)
  }, [id, selectProjet])

  return {
    ...store,
    data: store.selectedProjet,
    projet: store.selectedProjet,
  }
}