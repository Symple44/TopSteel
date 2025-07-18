'use client'

import { useState, useEffect, useCallback } from 'react'

export function useSelectedPages() {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les pages sélectionnées depuis l'API
  const loadSelectedPages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/menu-preferences/selected-pages')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }
      
      const data = await response.json()
      
      if (data.success) {
        const pages = Array.isArray(data.data) ? data.data : []
        setSelectedPages(new Set(pages))
      } else {
        setError(data.message || 'Erreur inconnue')
      }
    } catch (err) {
      console.error('Erreur lors du chargement des pages sélectionnées:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  // Sauvegarder les pages sélectionnées
  const saveSelectedPages = useCallback(async (pages: Set<string>) => {
    try {
      const pagesArray = Array.from(pages)
      console.log('[useSelectedPages] Sauvegarde de', pagesArray.length, 'pages')
      
      const response = await fetch('/api/user/menu-preferences/selected-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPages: pagesArray })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur de sauvegarde')
      }
      
      return true
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError('Erreur de sauvegarde')
      return false
    }
  }, [])

  // Ajouter/retirer une page
  const togglePage = useCallback(async (pageId: string) => {
    const newSelected = new Set(selectedPages)
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId)
    } else {
      newSelected.add(pageId)
    }
    
    // Mettre à jour l'état local immédiatement
    setSelectedPages(newSelected)
    
    // Sauvegarder en arrière-plan
    await saveSelectedPages(newSelected)
  }, [selectedPages, saveSelectedPages])

  // Sélectionner toutes les pages
  const selectAllPages = useCallback(async (allPageIds: string[]) => {
    const newSelected = new Set(allPageIds)
    setSelectedPages(newSelected)
    await saveSelectedPages(newSelected)
  }, [saveSelectedPages])

  // Désélectionner toutes les pages
  const deselectAllPages = useCallback(async () => {
    const newSelected = new Set<string>()
    setSelectedPages(newSelected)
    await saveSelectedPages(newSelected)
  }, [saveSelectedPages])

  // Réinitialiser
  const resetSelection = useCallback(async () => {
    await deselectAllPages()
  }, [deselectAllPages])

  // Charger au montage
  useEffect(() => {
    loadSelectedPages()
  }, [loadSelectedPages])

  return {
    selectedPages,
    loading,
    error,
    togglePage,
    selectAllPages,
    deselectAllPages,
    resetSelection,
    isSelected: (pageId: string) => selectedPages.has(pageId),
    selectedCount: selectedPages.size,
    refreshSelectedPages: loadSelectedPages
  }
}