/**
 * Hook pour gérer les préférences d'apparence utilisateur
 * Fichier: apps/web/src/hooks/use-appearance-settings.ts
 */

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'vibrant' | 'system'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  sidebarWidth: 'compact' | 'normal' | 'wide'
  density: 'compact' | 'comfortable' | 'spacious'
  accentColor: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red'
  contentWidth: 'compact' | 'full'
}

interface UseAppearanceSettingsReturn {
  settings: AppearanceSettings
  updateSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void
  saveSettings: () => Promise<void>
  resetSettings: () => void
  isLoading: boolean
  hasUnsavedChanges: boolean
}

const defaultSettings: AppearanceSettings = {
  theme: 'vibrant', // Thème coloré par défaut
  language: 'fr',
  fontSize: 'medium',
  sidebarWidth: 'normal',
  density: 'comfortable',
  accentColor: 'blue',
  contentWidth: 'compact' // Compact par défaut comme actuellement
}

// Clé pour le localStorage
const STORAGE_KEY = 'topsteel-appearance-settings'

export function useAppearanceSettings(): UseAppearanceSettingsReturn {
  const { setTheme } = useTheme()
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings)
  const [savedSettings, setSavedSettings] = useState<AppearanceSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  // Charger les paramètres au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)
        
        // Essayer de charger depuis l'API d'abord
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
          
          // Récupérer le token d'authentification
          const authData = typeof window !== 'undefined' ? localStorage.getItem('topsteel-tokens') : null
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }
          
          if (authData) {
            try {
              const tokens = JSON.parse(authData)
              if (tokens.accessToken) {
                headers['Authorization'] = `Bearer ${tokens.accessToken}`
              }
            } catch {
              // Ignore token parsing errors
            }
          }
          
          const response = await fetch(`${apiUrl}/users/appearance/me`, {
            headers,
            credentials: 'include',
          })
          
          if (response.ok) {
            const apiSettings = await response.json()
            setSettings(apiSettings)
            setSavedSettings(apiSettings)
            setTheme(apiSettings.theme)
            applySettings(apiSettings)
            // Sauvegarder également en local pour le cache
            localStorage.setItem(STORAGE_KEY, JSON.stringify(apiSettings))
            return
          }
        } catch (apiError) {
          console.log('API non disponible, utilisation du localStorage')
        }
        
        // Fallback vers le localStorage
        const localSettings = localStorage.getItem(STORAGE_KEY)
        if (localSettings) {
          const parsedSettings = JSON.parse(localSettings) as AppearanceSettings
          setSettings(parsedSettings)
          setSavedSettings(parsedSettings)
          // Appliquer le thème immédiatement
          setTheme(parsedSettings.theme)
          applySettings(parsedSettings)
        } else {
          // Utiliser les paramètres par défaut
          setSettings(defaultSettings)
          setSavedSettings(defaultSettings)
          setTheme(defaultSettings.theme)
          applySettings(defaultSettings)
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres d\'apparence:', error)
        // En cas d'erreur, utiliser les paramètres par défaut
        setSettings(defaultSettings)
        setSavedSettings(defaultSettings)
        setTheme(defaultSettings.theme)
        applySettings(defaultSettings)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [setTheme])

  // Appliquer les paramètres au DOM
  const applySettings = useCallback((newSettings: AppearanceSettings) => {
    const root = document.documentElement
    
    // Appliquer la taille de police
    root.style.setProperty('--font-size-multiplier', 
      newSettings.fontSize === 'small' ? '0.875' :
      newSettings.fontSize === 'large' ? '1.125' : '1'
    )
    
    // Appliquer la densité
    root.style.setProperty('--density-multiplier',
      newSettings.density === 'compact' ? '0.75' :
      newSettings.density === 'spacious' ? '1.25' : '1'
    )
    
    // Appliquer la largeur de sidebar
    root.style.setProperty('--sidebar-width',
      newSettings.sidebarWidth === 'compact' ? '200px' :
      newSettings.sidebarWidth === 'wide' ? '320px' : '260px'
    )
    
    // Appliquer la largeur du contenu
    root.style.setProperty('--content-max-width',
      newSettings.contentWidth === 'full' ? 'none' : '1200px'
    )
    
    // Appliquer la couleur d'accent (via CSS custom properties)
    const accentColors = {
      blue: 'hsl(217 91% 60%)',
      green: 'hsl(142 76% 36%)',
      purple: 'hsl(270 91% 65%)',
      orange: 'hsl(45 86% 68%)',
      pink: 'hsl(340 82% 75%)',
      red: 'hsl(0 84% 60%)'
    }
    
    if (accentColors[newSettings.accentColor]) {
      root.style.setProperty('--accent-color', accentColors[newSettings.accentColor])
    }

    // Appliquer les classes CSS pour la densité
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
    document.body.classList.add(`density-${newSettings.density}`)
    
    // Appliquer les classes CSS pour la taille de police
    document.body.classList.remove('font-small', 'font-medium', 'font-large')
    document.body.classList.add(`font-${newSettings.fontSize}`)
    
    // Appliquer les classes CSS pour la largeur du contenu
    document.body.classList.remove('content-compact', 'content-full')
    document.body.classList.add(`content-${newSettings.contentWidth}`)
    
  }, [])

  // Mettre à jour un paramètre
  const updateSetting = useCallback(<K extends keyof AppearanceSettings>(
    key: K, 
    value: AppearanceSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Appliquer immédiatement certains changements
    if (key === 'theme') {
      setTheme(value as string)
    }
    
    applySettings(newSettings)
  }, [settings, setTheme, applySettings])

  // Sauvegarder les paramètres
  const saveSettings = useCallback(async () => {
    try {
      // Essayer de sauvegarder sur l'API d'abord
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
        
        // Récupérer le token d'authentification
        const authData = typeof window !== 'undefined' ? localStorage.getItem('topsteel-tokens') : null
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        
        if (authData) {
          try {
            const tokens = JSON.parse(authData)
            if (tokens.accessToken) {
              headers['Authorization'] = `Bearer ${tokens.accessToken}`
            }
          } catch {
            // Ignore token parsing errors
          }
        }
        
        const response = await fetch(`${apiUrl}/users/appearance/me`, {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: JSON.stringify(settings),
        })
        
        if (response.ok) {
          const updatedSettings = await response.json()
          setSavedSettings(updatedSettings)
          // Mettre à jour le cache local
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings))
          console.log('Paramètres d\'apparence sauvegardés sur le serveur:', updatedSettings)
          return
        } else {
          console.warn('Échec de la sauvegarde sur le serveur, sauvegarde locale seulement')
        }
      } catch (apiError) {
        console.warn('API non disponible pour la sauvegarde, sauvegarde locale seulement')
      }
      
      // Fallback vers localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      setSavedSettings(settings)
      console.log('Paramètres d\'apparence sauvegardés localement:', settings)
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      throw new Error('Impossible de sauvegarder les paramètres')
    }
  }, [settings])

  // Réinitialiser aux paramètres par défaut
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    setTheme(defaultSettings.theme)
    applySettings(defaultSettings)
  }, [setTheme, applySettings])

  // Vérifier s'il y a des changements non sauvegardés
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  return {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    isLoading,
    hasUnsavedChanges
  }
}

// Hook pour obtenir les paramètres actuels de manière synchrone
export function useCurrentAppearanceSettings() {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null)

  useEffect(() => {
    try {
      const localSettings = localStorage.getItem(STORAGE_KEY)
      if (localSettings) {
        setSettings(JSON.parse(localSettings))
      } else {
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Erreur lors de la lecture des paramètres:', error)
      setSettings(defaultSettings)
    }
  }, [])

  return settings
}