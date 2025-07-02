// apps/web/src/hooks/use-projets.ts
import { useProjetStore } from '@/stores/projet.store'
import { useEffect } from 'react'
import { shallow } from 'zustand/shallow'

export const useProjets = (autoFetch = true) => {
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

  useEffect(() => {
    if (autoFetch && store.projets.length === 0 && !store.isLoading) {
      store.fetchProjets()
    }
  }, [autoFetch])

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

  return {
    ...store,
    projet: store.selectedProjet,
  }
}