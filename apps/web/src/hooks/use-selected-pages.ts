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
        const errorText = await response.text()
        throw new Error(`Erreur lors du chargement (${response.status}): ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        const pages = Array.isArray(data.data) ? data.data : []
        setSelectedPages(new Set(pages))
      } else {
        const errorMsg = data.message || 'Erreur inconnue'
        setError(errorMsg)
      }
    } catch (err) {
      console.error('[useSelectedPages] Erreur lors du chargement des pages sélectionnées:', err)
      
      // En cas d'erreur, utiliser des pages par défaut pour ne pas bloquer l'UI
      // Ne pas afficher d'erreur si on peut récupérer avec des valeurs par défaut
      const defaultPages = ['dashboard', 'clients', 'projets', 'stocks', 'production']
      setSelectedPages(new Set(defaultPages))
      
      // Seulement définir une erreur si c'est critique (ex: problème d'authentification)
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403'))) {
        setError('Vous devez être connecté pour accéder aux préférences de menu')
      }
      // Sinon, laisser l'erreur à null et utiliser les valeurs par défaut
    } finally {
      setLoading(false)
    }
  }, [])

  // Sauvegarder les pages sélectionnées
  const saveSelectedPages = useCallback(async (pages: Set<string>) => {
    try {
      const pagesArray = Array.from(pages)
      
      const response = await fetch('/api/user/menu-preferences/selected-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPages: pagesArray })
      })
      
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erreur lors de la sauvegarde (${response.status}): ${errorText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur de sauvegarde')
      }
      
      
      // Déclencher un événement pour notifier les autres composants de recharger le menu
      // Ajouter un petit délai pour s'assurer que la BDD est bien mise à jour
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('menuPreferencesChanged'))
      }, 500)
      
      return true
    } catch (err) {
      console.error('[useSelectedPages] Erreur lors de la sauvegarde:', err)
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde')
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