/**
 * Hook pour gérer les préférences d'apparence utilisateur
 * Fichier: apps/web/src/hooks/use-appearance-settings.ts
 */

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { translator } from '@/lib/i18n/translator'
import { callClientApi } from '@/utils/backend-api'

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'vibrant' | 'system'
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
  theme: 'vibrant', // Thème coloré par défaut
  language: 'fr',
  fontSize: 'medium',
  sidebarWidth: 'normal',
  density: 'comfortable',
  accentColor: 'blue',
  contentWidth: 'compact', // Compact par défaut comme actuellement
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
      // Appliquer la couleur d'accent comme couleur primaire
      root.style.setProperty('--primary', accentColors[newSettings.accentColor])
      root.style.setProperty('--accent-color', `hsl(${accentColors[newSettings.accentColor]})`)

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

      // Créer ou mettre à jour une feuille de style pour forcer les couleurs
      let accentStyleElement = document.getElementById('topsteel-accent-styles')
      if (!accentStyleElement) {
        accentStyleElement = document.createElement('style')
        accentStyleElement.id = 'topsteel-accent-styles'
        document.head.appendChild(accentStyleElement)
      }

      // Générer les styles dynamiques pour la couleur d'accent
      accentStyleElement.textContent = `
        /* Couleurs d'accent personnalisées - plus douces */
        .bg-primary,
        .vibrant .bg-primary {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.15) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.1) 100%) !important;
          box-shadow: none !important;
        }
        
        .text-primary {
          color: hsl(${accentColors[newSettings.accentColor]} / 0.9) !important;
        }
        
        .border-primary {
          border-color: hsl(${accentColors[newSettings.accentColor]}) !important;
        }
        
        /* Boutons primaires - plus subtils */
        button.bg-primary,
        .btn-primary,
        .vibrant .btn-primary {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.9) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.8) 100%) !important;
          box-shadow: 0 2px 8px hsl(${accentColors[newSettings.accentColor]} / 0.2) !important;
        }
        
        button.bg-primary:hover,
        .btn-primary:hover,
        .vibrant .btn-primary:hover {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.9) 100%) !important;
          box-shadow: 0 4px 16px hsl(${accentColors[newSettings.accentColor]} / 0.3) !important;
        }
        
        /* Liens et éléments interactifs - couleur plus subtile */
        a {
          color: hsl(${accentColors[newSettings.accentColor]} / 0.8) !important;
        }
        
        a:hover {
          color: hsl(${accentColors[newSettings.accentColor]}) !important;
        }
        
        /* Focus states */
        input:focus,
        .vibrant input:focus {
          border-color: hsl(${accentColors[newSettings.accentColor]}) !important;
          box-shadow: 0 0 0 2px hsl(${accentColors[newSettings.accentColor]} / 0.2) !important;
        }
        
        /* Éléments sélectionnés */
        .tab-active,
        .selected,
        [data-state="active"] {
          color: hsl(${accentColors[newSettings.accentColor]}) !important;
          border-color: hsl(${accentColors[newSettings.accentColor]}) !important;
        }
        
        /* Icônes de navigation */
        .vibrant .navigation-icon,
        .from-primary.to-primary\\/80,
        .vibrant .from-primary.to-primary\\/80 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.8) 100%) !important;
        }
        
        /* Icône navigation au survol quand fermé */
        button.navigation-icon:hover {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.9) 100%) !important;
          box-shadow: 0 4px 16px hsl(${accentColors[newSettings.accentColor]} / 0.4) !important;
        }
        
        /* Progress bars et indicateurs */
        .bg-primary\\/10 {
          background-color: hsl(${accentColors[newSettings.accentColor]} / 0.1) !important;
        }
        
        .bg-primary\\/20 {
          background-color: hsl(${accentColors[newSettings.accentColor]} / 0.2) !important;
        }
        
        /* Menu sidebar - Gradients */
        .bg-gradient-to-br.from-blue-500.to-purple-600,
        .bg-gradient-to-r.from-blue-500.to-purple-600,
        .bg-gradient-to-b.from-blue-500.to-purple-600 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.85) 100%) !important;
        }
        
        /* Menu sidebar - Indicateur actif */
        .absolute.left-0.bg-gradient-to-b {
          background: linear-gradient(180deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.7) 100%) !important;
        }
        
        /* Menu sidebar - Icônes actives */
        .group-hover\\:text-foreground:hover {
          color: hsl(${accentColors[newSettings.accentColor]}) !important;
        }
        
        /* Badge du menu */
        .bg-gradient-to-r.from-blue-500.to-purple-600 {
          background: linear-gradient(90deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.9) 100%) !important;
        }
        
        /* Indicateur toggle mode */
        .bg-gradient-to-r.from-muted\\/50.to-accent\\/50:hover {
          background: linear-gradient(90deg, hsl(${accentColors[newSettings.accentColor]} / 0.2) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.4) 100%) !important;
        }
        
        /* Bouton toggle sidebar */
        .vibrant .toggle-button {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.05) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.08) 100%) !important;
          border: 1px solid hsl(${accentColors[newSettings.accentColor]} / 0.15) !important;
          box-shadow: 0 2px 8px hsl(${accentColors[newSettings.accentColor]} / 0.1) !important;
        }
        
        .vibrant .toggle-button:hover {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.8) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.7) 100%) !important;
          transform: scale(1.1) !important;
          box-shadow: 0 4px 16px hsl(${accentColors[newSettings.accentColor]} / 0.3) !important;
        }
        
        /* Avatar utilisateur dans le menu */
        .bg-gradient-to-br.from-emerald-500.to-teal-600 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.9) 100%) !important;
        }
        
        /* Header de la sidebar (zone Navigation / Modules ERP) */
        .vibrant .sidebar-header {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.03) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.05) 100%) !important;
          border-bottom: 1px solid hsl(${accentColors[newSettings.accentColor]} / 0.1) !important;
        }
        
        .vibrant .sidebar-header::before {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.05) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.08) 50%, hsl(${accentColors[newSettings.accentColor]} / 0.05) 100%) !important;
        }
        
        /* Switch du menu personnalisé/standard */
        .bg-gradient-to-r.from-muted\\/50.to-accent\\/20 {
          background: linear-gradient(90deg, hsl(${accentColors[newSettings.accentColor]} / 0.08) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.12) 100%) !important;
        }
        
        .hover\\:from-accent\\/20.hover\\:to-accent\\/30:hover {
          background: linear-gradient(90deg, hsl(${accentColors[newSettings.accentColor]} / 0.15) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.2) 100%) !important;
        }
        
        .bg-gradient-to-br.from-muted\\/60.to-accent\\/20 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.1) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.15) 100%) !important;
        }
        
        /* Switch - états personnalisé vs standard */
        .bg-gradient-to-br.from-purple-500.to-pink-600 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]}) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.9) 100%) !important;
        }
        
        .bg-gradient-to-r.from-purple-400.to-pink-500 {
          background: linear-gradient(90deg, hsl(${accentColors[newSettings.accentColor]} / 0.8) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.9) 100%) !important;
        }
        
        .bg-gradient-to-br.from-purple-400.to-pink-500 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.8) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.9) 100%) !important;
        }
        
        /* Info-bulles améliorées */
        .bg-slate-900\\/95 {
          background-color: hsl(220 13% 18% / 0.95) !important;
        }
        
        .dark .bg-slate-800\\/95 {
          background-color: hsl(220 13% 15% / 0.95) !important;
        }
        
        .border-slate-700\\/50 {
          border-color: hsl(${accentColors[newSettings.accentColor]} / 0.2) !important;
        }
        
        .dark .border-slate-600\\/50 {
          border-color: hsl(${accentColors[newSettings.accentColor]} / 0.25) !important;
        }
        
        /* Tous les gradients génériques - désactivé pour éviter trop d'impact */
        /* [class*="from-"][class*="to-"] {
          --tw-gradient-from: hsl(${accentColors[newSettings.accentColor]}) !important;
          --tw-gradient-to: hsl(${accentColors[newSettings.accentColor]} / 0.8) !important;
        } */
        
        /* Icônes et éléments de page - plus subtils */
        .from-indigo-600.to-purple-600,
        .from-indigo-500.to-purple-600 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.8) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.6) 100%) !important;
        }
        
        /* Logo dans le header */
        .bg-gradient-to-br.from-primary.to-primary\\/80 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.9) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.75) 100%) !important;
        }
        
        /* Backgrounds colorés des pages - très légers */
        .bg-gradient-to-br.from-indigo-50,
        .bg-gradient-to-br.from-purple-50 {
          background: linear-gradient(135deg, hsl(${accentColors[newSettings.accentColor]} / 0.05) 0%, hsl(${accentColors[newSettings.accentColor]} / 0.03) 100%) !important;
        }
      `
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
    if (!hasInitialized.current) return

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
