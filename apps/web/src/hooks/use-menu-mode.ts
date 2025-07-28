'use client'

import { useState, useEffect, useCallback } from 'react'

export type MenuMode = 'standard' | 'custom'

interface MenuModeState {
  mode: MenuMode
  lastChanged: string
}

const STORAGE_KEY = 'topsteel-menu-mode'

export function useMenuMode() {
  const [mode, setMode] = useState<MenuMode>('standard')
  const [loading, setLoading] = useState(true)

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const state: MenuModeState = JSON.parse(stored)
        setMode(state.mode)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du mode menu:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Sauvegarder l'état dans localStorage
  const saveMode = useCallback((newMode: MenuMode) => {
    try {
      const state: MenuModeState = {
        mode: newMode,
        lastChanged: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du mode menu:', error)
    }
  }, [])

  // Basculer entre standard et custom
  const toggleMode = useCallback(() => {
    const newMode: MenuMode = mode === 'standard' ? 'custom' : 'standard'
    setMode(newMode)
    saveMode(newMode)
  }, [mode, saveMode])

  // Définir un mode spécifique
  const setMenuMode = useCallback((newMode: MenuMode) => {
    setMode(newMode)
    saveMode(newMode)
  }, [saveMode])

  return {
    mode,
    loading,
    toggleMode,
    setMenuMode,
    isStandard: mode === 'standard',
    isCustom: mode === 'custom'
  }
}