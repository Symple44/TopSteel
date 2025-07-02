'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderContext {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
  isHydrated: boolean
}

const ThemeProviderContext = createContext<ThemeProviderContext | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'erp-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [isHydrated, setIsHydrated] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')

  // Hydratation avec synchronisation stores existants
  useEffect(() => {
    try {
      // Vérifier localStorage
      const storedTheme = localStorage.getItem(storageKey) as Theme
      if (storedTheme && ['dark', 'light', 'system'].includes(storedTheme)) {
        setThemeState(storedTheme)
      }
      
      // Synchroniser avec stores existants si présents
      try {
        const appStateStr = localStorage.getItem('erp-app-state')
        if (appStateStr) {
          const appState = JSON.parse(appStateStr)
          if (appState.state?.theme) {
            setThemeState(appState.state.theme)
          }
        }
      } catch (e) {
        console.debug('Store sync: app state non disponible')
      }
      
      try {
        const uiStateStr = localStorage.getItem('topsteel-ui')
        if (uiStateStr) {
          const uiState = JSON.parse(uiStateStr)
          if (uiState.state?.theme) {
            setThemeState(uiState.state.theme)
          }
        }
      } catch (e) {
        console.debug('Store sync: ui state non disponible')
      }
      
    } catch (error) {
      console.warn('Theme: failed to read from localStorage', error)
    }
    
    setIsHydrated(true)
  }, [storageKey])

  // Résolution du thème avec système
  useEffect(() => {
    if (!isHydrated) return

    const resolveTheme = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return theme
    }

    const updateResolvedTheme = () => {
      const resolved = resolveTheme()
      setResolvedTheme(resolved)
      
      // Manipulation DOM centralisée
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      // Synchroniser avec stores existants
      try {
        // Déclencher événement custom pour synchronisation stores
        window.dispatchEvent(new CustomEvent('theme-change', { 
          detail: { theme, resolved } 
        }))
      } catch (e) {
        console.debug('Theme sync event failed')
      }
    }

    updateResolvedTheme()

    // Écoute des changements système
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateResolvedTheme)
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
    }
  }, [theme, isHydrated])

  // Fonction de changement avec synchronisation stores
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    
    try {
      localStorage.setItem(storageKey, newTheme)
      
      // Synchroniser avec stores existants
      try {
        const appStateStr = localStorage.getItem('erp-app-state')
        if (appStateStr) {
          const appState = JSON.parse(appStateStr)
          appState.state.theme = newTheme
          localStorage.setItem('erp-app-state', JSON.stringify(appState))
        }
      } catch (e) { /* TODO: Implémenter */ }
      
      try {
        const uiStateStr = localStorage.getItem('topsteel-ui')
        if (uiStateStr) {
          const uiState = JSON.parse(uiStateStr)
          uiState.state.theme = newTheme
          localStorage.setItem('topsteel-ui', JSON.stringify(uiState))
        }
      } catch (e) { /* TODO: Implémenter */ }
      
    } catch (error) {
      console.warn('Theme: failed to write to localStorage', error)
    }
  }

  // Rendu conditionnel pour SSR
  if (!isHydrated) {
    return <div className="theme-loading">{children}</div>
  }

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        isHydrated,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

