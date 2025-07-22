/**
 * Hook pour gérer les préférences de notification utilisateur
 * Fichier: apps/web/src/hooks/use-notification-settings.ts
 */

import { useState, useEffect, useCallback } from 'react'

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  emailTypes: {
    newMessages: boolean
    systemAlerts: boolean
    taskReminders: boolean
    weeklyReports: boolean
    securityAlerts: boolean
    maintenanceNotice: boolean
  }
  pushTypes: {
    enabled: boolean
    sound: boolean
    urgent: boolean
    normal: boolean
    quiet: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

interface UseNotificationSettingsReturn {
  settings: NotificationSettings
  updateSetting: (key: keyof NotificationSettings, value: any) => void
  updateNestedSetting: (category: keyof NotificationSettings, key: string, value: any) => void
  saveSettings: () => Promise<void>
  resetSettings: () => void
  isLoading: boolean
  hasUnsavedChanges: boolean
}

const defaultSettings: NotificationSettings = {
  email: true,
  push: true,
  sms: false,
  emailTypes: {
    newMessages: true,
    systemAlerts: true,
    taskReminders: false,
    weeklyReports: true,
    securityAlerts: true,
    maintenanceNotice: false
  },
  pushTypes: {
    enabled: true,
    sound: true,
    urgent: true,
    normal: false,
    quiet: true
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00'
  }
}

// Clé pour le localStorage
const STORAGE_KEY = 'topsteel-notification-settings'

export function useNotificationSettings(): UseNotificationSettingsReturn {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [savedSettings, setSavedSettings] = useState<NotificationSettings>(defaultSettings)
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
          
          const response = await fetch(`${apiUrl}/users/notifications/me`, {
            headers,
            credentials: 'include',
          })
          
          if (response.ok) {
            const apiSettings = await response.json()
            setSettings(apiSettings)
            setSavedSettings(apiSettings)
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
          const parsedSettings = JSON.parse(localSettings) as NotificationSettings
          setSettings(parsedSettings)
          setSavedSettings(parsedSettings)
        } else {
          // Utiliser les paramètres par défaut
          setSettings(defaultSettings)
          setSavedSettings(defaultSettings)
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de notification:', error)
        // En cas d'erreur, utiliser les paramètres par défaut
        setSettings(defaultSettings)
        setSavedSettings(defaultSettings)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Mettre à jour un paramètre principal
  const updateSetting = useCallback((key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Mettre à jour un paramètre imbriqué
  const updateNestedSetting = useCallback((category: keyof NotificationSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }, [])

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
        
        const response = await fetch(`${apiUrl}/users/notifications/me`, {
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
          console.log('Paramètres de notification sauvegardés sur le serveur:', updatedSettings)
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
      console.log('Paramètres de notification sauvegardés localement:', settings)
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error)
      throw new Error('Impossible de sauvegarder les paramètres')
    }
  }, [settings])

  // Réinitialiser aux paramètres par défaut
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
  }, [])

  // Vérifier s'il y a des changements non sauvegardés
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  return {
    settings,
    updateSetting,
    updateNestedSetting,
    saveSettings,
    resetSettings,
    isLoading,
    hasUnsavedChanges
  }
}