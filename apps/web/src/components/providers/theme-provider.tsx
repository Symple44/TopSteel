'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = 'dark' | 'light'

interface ThemeMetrics {
  changeCount: number
  lastChange: number
  errors: number
}

interface ThemeProviderContext {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
  isHydrated: boolean
  isChanging: boolean
  metrics: ThemeMetrics
}

const ThemeProviderContext = createContext<ThemeProviderContext | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableSystemWatch?: boolean
  enableMetrics?: boolean
  transitionDuration?: number
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'topsteel-theme',
  enableSystemWatch = true,
  enableMetrics = true,
  transitionDuration = 150
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [isHydrated, setIsHydrated] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [metrics, setMetrics] = useState<ThemeMetrics>({
    changeCount: 0,
    lastChange: 0,
    errors: 0
  })

  const mediaQueryRef = useRef<MediaQueryList | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const resolveTheme = useCallback((): ResolvedTheme => {
    if (theme === 'system') {
      return (typeof window !== 'undefined' && 
              window.matchMedia('(prefers-color-scheme: dark)').matches) 
        ? 'dark' : 'light'
    }
    return theme as ResolvedTheme
  }, [theme])

  const updateDOM = useCallback((resolved: ResolvedTheme) => {
    if (typeof window === 'undefined') return

    try {
      const root = document.documentElement
      const currentHasDark = root.classList.contains('dark')
      const shouldHaveDark = resolved === 'dark'

      if (currentHasDark !== shouldHaveDark) {
        if (shouldHaveDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }

        window.dispatchEvent(new CustomEvent('theme-changed', {
          detail: { theme, resolved, timestamp: Date.now() }
        }))
      }
    } catch (error) {
      console.error('Theme DOM update failed:', error)
      setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }))
    }
  }, [theme])

  const saveToStorage = useCallback(async (newTheme: Theme): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    try {
      localStorage.setItem(storageKey, newTheme)
      
      const legacyStores = ['erp-theme', 'erp-app-state', 'topsteel-ui']
      
      for (const storeKey of legacyStores) {
        try {
          const existingData = localStorage.getItem(storeKey)
          if (existingData) {
            const parsed = JSON.parse(existingData)
            if (parsed.state) {
              parsed.state.theme = newTheme
              localStorage.setItem(storeKey, JSON.stringify(parsed))
            }
          }
        } catch (e) {
          console.debug(`Failed to migrate ${storeKey}:`, e)
        }
      }

      retryCountRef.current = 0
      return true
    } catch (error) {
      console.error('Theme storage failed:', error)
      
      if (retryCountRef.current < 3) {
        retryCountRef.current++
        setTimeout(() => saveToStorage(newTheme), 1000 * retryCountRef.current)
      }
      
      setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }))
      return false
    }
  }, [storageKey])

  // Hydration effect
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      const validThemes: Theme[] = ['light', 'dark', 'system']
      
      if (stored && validThemes.includes(stored)) {
        setThemeState(stored)
      }

      if (!stored) {
        const legacyTheme = localStorage.getItem('erp-theme') as Theme
        if (legacyTheme && validThemes.includes(legacyTheme)) {
          setThemeState(legacyTheme)
          saveToStorage(legacyTheme)
        }
      }

    } catch (error) {
      console.warn('Theme hydration failed:', error)
      setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }))
    }

    setIsHydrated(true)
  }, [storageKey, saveToStorage])

  // Theme resolution and system watch effect
  useEffect(() => {
    if (!isHydrated) return

    const resolved = resolveTheme()
    setResolvedTheme(resolved)
    updateDOM(resolved)

    // Always return a cleanup function, even if it's empty
    if (enableSystemWatch && theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQueryRef.current = mediaQuery

      const handleChange = () => {
        const newResolved = resolveTheme()
        setResolvedTheme(newResolved)
        updateDOM(newResolved)
      }

      mediaQuery.addEventListener('change', handleChange)
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
        mediaQueryRef.current = null
      }
    }

    // Return empty cleanup function for consistency
    return () => {
      // No cleanup needed when not watching system theme
    }
  }, [theme, isHydrated, resolveTheme, updateDOM, enableSystemWatch])

  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme === theme) return

    setIsChanging(true)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setThemeState(newTheme)
    saveToStorage(newTheme)

    if (enableMetrics) {
      setMetrics(prev => ({
        ...prev,
        changeCount: prev.changeCount + 1,
        lastChange: Date.now()
      }))
    }

    timeoutRef.current = setTimeout(() => {
      setIsChanging(false)
    }, transitionDuration)

  }, [theme, saveToStorage, enableMetrics, transitionDuration])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!isHydrated) {
    return (
      <div className="theme-loading" data-theme="loading">
        {children}
      </div>
    )
  }

  const contextValue: ThemeProviderContext = {
    theme,
    setTheme,
    resolvedTheme,
    isHydrated,
    isChanging,
    metrics
  }

  return (
    <ThemeProviderContext.Provider value={contextValue}>
      <div data-theme={resolvedTheme} className={isChanging ? 'theme-changing' : ''}>
        {children}
      </div>
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

export const useThemeMetrics = () => {
  const { metrics } = useTheme()
  return metrics
}

export const useResolvedTheme = () => {
  const { resolvedTheme } = useTheme()
  return resolvedTheme
}

export const useThemeTransition = () => {
  const { isChanging } = useTheme()
  return isChanging
}