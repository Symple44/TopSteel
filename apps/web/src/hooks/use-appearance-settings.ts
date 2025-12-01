/**
 * Hook pour gérer les préférences d'apparence utilisateur
 * Fichier: apps/web/src/hooks/use-appearance-settings.ts
 */

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { translator } from '../lib/i18n/translator'
import { callClientApi } from '../utils/backend-api'

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  sidebarWidth: 'compact' | 'normal' | 'wide'
  density: 'compact' | 'comfortable' | 'spacious'
  accentColor:
    | 'blue'
    | 'green'
    | 'purple'
    | 'orange'
    | 'pink'
    | 'red'
    | 'teal'
    | 'indigo'
    | 'yellow'
    | 'emerald'
    | 'rose'
    | 'cyan'
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
  theme: 'light',
  language: 'fr',
  fontSize: 'medium',
  sidebarWidth: 'normal',
  density: 'comfortable',
  accentColor: 'blue',
  contentWidth: 'full', // Full width par défaut (option retirée de l'UI)
}

// Clé pour le localStorage
const STORAGE_KEY = 'topsteel-appearance-settings'
const THEME_STORAGE_KEY = 'topsteel-theme' // Même clé que next-themes

export function useAppearanceSettings(): UseAppearanceSettingsReturn {
  const { setTheme } = useTheme()
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings)
  const [savedSettings, setSavedSettings] = useState<AppearanceSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const hasInitialized = useRef(false)
  const isLoadingRef = useRef(false)
  const settingsRef = useRef<AppearanceSettings>(defaultSettings)
  const lastAppliedSettings = useRef<AppearanceSettings>(defaultSettings)

  // Appliquer les paramètres au DOM
  const applySettings = useCallback((newSettings: AppearanceSettings) => {
    const root = document.documentElement

    // Appliquer la langue au document ET au système i18n
    root.setAttribute('lang', newSettings.language || 'fr')

    // Synchroniser avec le système i18n
    if (translator.getCurrentLanguage() !== newSettings.language) {
      translator.setLanguage(newSettings.language)
    }

    // Appliquer la taille de police
    root.style.setProperty(
      '--font-size-multiplier',
      newSettings.fontSize === 'small' ? '0.875' : newSettings.fontSize === 'large' ? '1.125' : '1'
    )

    // Appliquer la densité
    root.style.setProperty(
      '--density-multiplier',
      newSettings.density === 'compact' ? '0.75' : newSettings.density === 'spacious' ? '1.25' : '1'
    )

    // Appliquer la largeur de sidebar
    root.style.setProperty(
      '--sidebar-width',
      newSettings.sidebarWidth === 'compact'
        ? '200px'
        : newSettings.sidebarWidth === 'wide'
          ? '320px'
          : '260px'
    )

    // Appliquer la largeur du contenu
    root.style.setProperty(
      '--content-max-width',
      newSettings.contentWidth === 'full' ? 'none' : '1200px'
    )

    // Appliquer la couleur d'accent (via CSS custom properties)
    const accentColors = {
      blue: '217 91% 60%',
      green: '142 76% 36%',
      purple: '270 91% 65%',
      orange: '45 86% 68%',
      pink: '340 82% 75%',
      red: '0 84% 60%',
      teal: '173 80% 40%',
      indigo: '239 84% 67%',
      yellow: '48 96% 53%',
      emerald: '160 84% 39%',
      rose: '330 81% 60%',
      cyan: '188 94% 59%',
    }

    if (accentColors[newSettings.accentColor]) {
      const accentColor = accentColors[newSettings.accentColor]

      // Appliquer la couleur d'accent comme couleur primaire
      root.style.setProperty('--primary', accentColor)
      root.style.setProperty('--accent-color', `hsl(${accentColor})`)

      // Ajuster la couleur de texte primaire selon la luminosité
      const luminosityMap = {
        blue: '220 13% 98%',
        green: '142 20% 98%',
        purple: '270 20% 98%',
        orange: '45 20% 15%', // Texte sombre pour orange
        pink: '340 20% 98%',
        red: '0 20% 98%',
        teal: '173 20% 98%',
        indigo: '239 20% 98%',
        yellow: '48 20% 15%', // Texte sombre pour jaune
        emerald: '160 20% 98%',
        rose: '330 20% 98%',
        cyan: '188 20% 15%', // Texte sombre pour cyan
      }

      root.style.setProperty(
        '--primary-foreground',
        luminosityMap[newSettings.accentColor] || '0 0% 98%'
      )

      // Définir toutes les variations de couleur comme CSS Custom Properties
      // Ces variables seront utilisées par globals.css sans avoir besoin de !important

      // Variations d'opacité pour les backgrounds
      root.style.setProperty('--accent-5', `hsl(${accentColor} / 0.05)`)
      root.style.setProperty('--accent-8', `hsl(${accentColor} / 0.08)`)
      root.style.setProperty('--accent-10', `hsl(${accentColor} / 0.10)`)
      root.style.setProperty('--accent-12', `hsl(${accentColor} / 0.12)`)
      root.style.setProperty('--accent-15', `hsl(${accentColor} / 0.15)`)
      root.style.setProperty('--accent-20', `hsl(${accentColor} / 0.20)`)
      root.style.setProperty('--accent-25', `hsl(${accentColor} / 0.25)`)
      root.style.setProperty('--accent-30', `hsl(${accentColor} / 0.30)`)
      root.style.setProperty('--accent-40', `hsl(${accentColor} / 0.40)`)

      // Variations d'opacité pour les éléments plus visibles
      root.style.setProperty('--accent-60', `hsl(${accentColor} / 0.60)`)
      root.style.setProperty('--accent-70', `hsl(${accentColor} / 0.70)`)
      root.style.setProperty('--accent-75', `hsl(${accentColor} / 0.75)`)
      root.style.setProperty('--accent-80', `hsl(${accentColor} / 0.80)`)
      root.style.setProperty('--accent-85', `hsl(${accentColor} / 0.85)`)
      root.style.setProperty('--accent-90', `hsl(${accentColor} / 0.90)`)
      root.style.setProperty('--accent-95', `hsl(${accentColor} / 0.95)`)
      root.style.setProperty('--accent-100', `hsl(${accentColor})`)

      // Couleurs pour les tooltips (slate colors)
      root.style.setProperty('--tooltip-bg-light', 'hsl(220 13% 18% / 0.95)')
      root.style.setProperty('--tooltip-bg-dark', 'hsl(220 13% 15% / 0.95)')

      // Variables pour les gradients
      root.style.setProperty('--gradient-from', `hsl(${accentColor})`)
      root.style.setProperty('--gradient-to', `hsl(${accentColor} / 0.8)`)
      root.style.setProperty('--gradient-to-light', `hsl(${accentColor} / 0.6)`)
      root.style.setProperty('--gradient-to-lighter', `hsl(${accentColor} / 0.3)`)

      // Nettoyer l'ancienne feuille de style si elle existe
      const oldStyleElement = document.getElementById('topsteel-accent-styles')
      if (oldStyleElement) {
        oldStyleElement.remove()
      }
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

  // Charger les paramètres au démarrage
  useEffect(() => {
    if (hasInitialized.current || isLoadingRef.current) return // Éviter les rechargements multiples

    const loadSettings = async () => {
      try {
        setIsLoading(true)
        isLoadingRef.current = true

        // Charger d'abord depuis localStorage pour éviter le flash de thème par défaut
        const localSettings = localStorage.getItem(STORAGE_KEY)
        const themeFromNextThemes = localStorage.getItem(THEME_STORAGE_KEY)
        const languageFromI18n = translator.getCurrentLanguage()

        let initialSettings = defaultSettings
        if (localSettings) {
          try {
            const parsedSettings = JSON.parse(localSettings) as AppearanceSettings

            // Si next-themes a un thème différent, utiliser celui de next-themes
            if (themeFromNextThemes && themeFromNextThemes !== parsedSettings.theme) {
              parsedSettings.theme = themeFromNextThemes as AppearanceSettings['theme']
            }

            // Synchroniser avec la langue du système i18n si différente
            if (languageFromI18n && languageFromI18n !== parsedSettings.language) {
              parsedSettings.language = languageFromI18n
            }

            // Migration: forcer contentWidth à 'full' (option retirée de l'UI)
            parsedSettings.contentWidth = 'full'

            // Migration: si thème vibrant, basculer vers light (vibrant retiré des options)
            if ((parsedSettings.theme as string) === 'vibrant') {
              parsedSettings.theme = 'light'
            }

            initialSettings = parsedSettings
            setSettings(parsedSettings)
            setSavedSettings(parsedSettings)
            settingsRef.current = parsedSettings
            // Appliquer le thème immédiatement pour éviter le flash
            setTheme(parsedSettings.theme)
            applySettings(parsedSettings)
            lastAppliedSettings.current = parsedSettings
          } catch (_error) {
            // Erreur de parsing, utiliser défaut ou thème de next-themes
            const fallbackTheme =
              (themeFromNextThemes as AppearanceSettings['theme']) || defaultSettings.theme
            const fallbackSettings = { ...defaultSettings, theme: fallbackTheme }
            setTheme(fallbackSettings.theme)
            applySettings(fallbackSettings)
            lastAppliedSettings.current = fallbackSettings
          }
        } else {
          // Pas de localStorage, vérifier si next-themes a un thème ou si i18n a une langue
          const fallbackSettings = {
            ...defaultSettings,
            theme: (themeFromNextThemes as AppearanceSettings['theme']) || defaultSettings.theme,
            language: languageFromI18n || defaultSettings.language,
          }
          setSettings(fallbackSettings)
          setSavedSettings(fallbackSettings)
          settingsRef.current = fallbackSettings
          setTheme(fallbackSettings.theme)
          applySettings(fallbackSettings)
          lastAppliedSettings.current = fallbackSettings
        }

        // Essayer de charger depuis l'API pour mise à jour
        try {
          const response = await callClientApi('users/appearance/me')

          if (response.ok) {
            const apiResponse = await response.json()

            // Extraire les paramètres d'apparence de la structure de réponse API
            let apiSettings = defaultSettings
            if (
              apiResponse.success &&
              apiResponse.data &&
              apiResponse.data.preferences &&
              apiResponse.data.preferences.appearance
            ) {
              apiSettings = apiResponse.data.preferences.appearance
            } else if (apiResponse.data && typeof apiResponse.data === 'object') {
              // Fallback si la structure est différente
              apiSettings = { ...defaultSettings, ...apiResponse.data }
            }

            // Valider et corriger les valeurs invalides de l'API
            if (
              (apiSettings.theme as unknown) === 'undefined' ||
              apiSettings.theme === undefined ||
              !apiSettings.theme
            ) {
              apiSettings.theme = defaultSettings.theme
            }

            // Migration: forcer contentWidth à 'full' (option retirée de l'UI)
            apiSettings.contentWidth = 'full'

            // Migration: si thème vibrant, basculer vers light (vibrant retiré des options)
            if ((apiSettings.theme as string) === 'vibrant') {
              apiSettings.theme = 'light'
            }

            // Seulement mettre à jour si les données API sont différentes de localStorage
            const currentSettingsJson = JSON.stringify(initialSettings)
            const apiSettingsJson = JSON.stringify(apiSettings)

            if (apiSettingsJson !== currentSettingsJson) {
              setSettings(apiSettings)
              setSavedSettings(apiSettings)
              settingsRef.current = apiSettings
              setTheme(apiSettings.theme)
              applySettings(apiSettings)
              lastAppliedSettings.current = apiSettings
              localStorage.setItem(STORAGE_KEY, JSON.stringify(apiSettings))
            }
            return
          }
        } catch (_apiError) {
          // API unavailable, already loaded from localStorage above
          // Ne pas recharger depuis localStorage car déjà fait ci-dessus
        }
      } catch (_error) {
        // En cas d'erreur, utiliser les paramètres par défaut
        setSettings(defaultSettings)
        setSavedSettings(defaultSettings)
        settingsRef.current = defaultSettings
        setTheme(defaultSettings.theme)
        applySettings(defaultSettings)
        lastAppliedSettings.current = defaultSettings
      } finally {
        setIsLoading(false)
        isLoadingRef.current = false
        hasInitialized.current = true // Marquer comme initialisé
      }
    }

    loadSettings()
  }, [applySettings, setTheme]) // Supprimer la dépendance setTheme qui causait la boucle

  // Appliquer les changements de settings de manière asynchrone
  useEffect(() => {
    if (
      hasInitialized.current &&
      JSON.stringify(settings) !== JSON.stringify(lastAppliedSettings.current)
    ) {
      setTheme(settings.theme)
      applySettings(settings)
      // Synchroniser avec next-themes localStorage
      localStorage.setItem(THEME_STORAGE_KEY, settings.theme)
      lastAppliedSettings.current = settings
    }
  }, [settings, setTheme, applySettings])

  // Écouter les changements du translator i18n
  useEffect(() => {
    if (!hasInitialized.current) return undefined

    const unsubscribe = translator.subscribe(() => {
      const currentLang = translator.getCurrentLanguage()
      if (currentLang !== settings.language) {
        // La langue du translator a changé, synchroniser les settings
        setSettings((prevSettings) => ({
          ...prevSettings,
          language: currentLang,
        }))
      }
    })

    return unsubscribe
  }, [settings.language])

  // Mettre à jour un paramètre
  const updateSetting = useCallback(
    <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
      setSettings((prevSettings) => {
        const newSettings = { ...prevSettings, [key]: value }
        settingsRef.current = newSettings // Synchroniser la ref
        return newSettings
      })
    },
    []
  )

  // Sauvegarder les paramètres
  const saveSettings = useCallback(async () => {
    const currentSettings = settingsRef.current // Utiliser la ref pour éviter les fermetures
    try {
      // Essayer de sauvegarder sur l'API d'abord
      try {
        const response = await callClientApi('users/appearance/me', {
          method: 'PATCH',
          body: JSON.stringify(currentSettings),
        })

        if (response.ok) {
          const apiResponse = await response.json()

          // Extraire les paramètres d'apparence mis à jour de la structure de réponse API
          let updatedSettings = currentSettings
          if (
            apiResponse.success &&
            apiResponse.data &&
            apiResponse.data.preferences &&
            apiResponse.data.preferences.appearance
          ) {
            updatedSettings = apiResponse.data.preferences.appearance
          } else if (apiResponse.data && typeof apiResponse.data === 'object') {
            // Fallback si la structure est différente
            updatedSettings = { ...currentSettings, ...apiResponse.data }
          }

          setSavedSettings(updatedSettings)
          // Mettre à jour le cache local
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings))
          // Synchroniser le thème avec next-themes
          localStorage.setItem(THEME_STORAGE_KEY, updatedSettings.theme)
          // Settings saved on server
          return
        } else {
          // Server save failed, using local storage
        }
      } catch (_apiError) {
        // API unavailable, using local storage
      }

      // Fallback vers localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings))
      // Synchroniser le thème avec next-themes
      localStorage.setItem(THEME_STORAGE_KEY, currentSettings.theme)
      setSavedSettings(currentSettings)
      // Settings saved locally
    } catch (_error) {
      throw new Error('Impossible de sauvegarder les paramètres')
    }
  }, []) // Pas de dépendance sur settings pour éviter les re-renders

  // Réinitialiser aux paramètres par défaut
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    settingsRef.current = defaultSettings
    setTheme(defaultSettings.theme)
    applySettings(defaultSettings)
    lastAppliedSettings.current = defaultSettings
  }, [setTheme, applySettings])

  // Vérifier s'il y a des changements non sauvegardés
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  return {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    isLoading,
    hasUnsavedChanges,
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
    } catch (_error) {
      setSettings(defaultSettings)
    }
  }, [])

  return settings
}
