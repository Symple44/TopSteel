/**
 * 🎨 THEME PROVIDER ENTERPRISE - TOPSTEEL ERP
 * Provider de thème optimisé pour performance et robustesse
 * 
 * Fonctionnalités:
 * - Transitions fluides sans flash
 * - Synchronisation multi-onglets
 * - Persistence robuste avec fallbacks
 * - Détection automatique des préférences
 * - Métriques de performance
 * - Error boundaries intégrés
 * - SSR-Safe avec hydratation progressive
 * - Support des Custom Properties CSS
 */

'use client'

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// =============================================
// TYPES ET INTERFACES
// =============================================

export type Theme = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

export interface ThemeMetrics {
  changeCount: number
  lastChange: number
  errors: number
  hydrationTime: number
  transitionCount: number
  storageErrors: number
}

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

export interface ThemeProviderContext {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: ResolvedTheme
  isHydrated: boolean
  isChanging: boolean
  isSystemTheme: boolean
  metrics: ThemeMetrics
  colors: ThemeColors
  toggleTheme: () => void
  setSystemTheme: () => void
  clearTheme: () => void
}

export interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: 'class' | 'data-theme'
  enableSystem?: boolean
  enableTransitions?: boolean
  enableMetrics?: boolean
  enableSync?: boolean
  transitionDuration?: number
  fallbackTheme?: ResolvedTheme
  customColors?: Partial<Record<ResolvedTheme, Partial<ThemeColors>>>
}

// =============================================
// CONSTANTES ET CONFIGURATIONS
// =============================================

const DEFAULT_COLORS: Record<ResolvedTheme, ThemeColors> = {
  light: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(222.2 84% 4.9%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(222.2 84% 4.9%)',
    primary: 'hsl(221.2 83.2% 53.3%)',
    primaryForeground: 'hsl(210 40% 98%)',
    secondary: 'hsl(210 40% 96%)',
    secondaryForeground: 'hsl(222.2 84% 4.9%)',
    muted: 'hsl(210 40% 96%)',
    mutedForeground: 'hsl(215.4 16.3% 46.9%)',
    accent: 'hsl(210 40% 96%)',
    accentForeground: 'hsl(222.2 84% 4.9%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: 'hsl(221.2 83.2% 53.3%)',
  },
  dark: {
    background: 'hsl(222.2 84% 4.9%)',
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(222.2 84% 4.9%)',
    cardForeground: 'hsl(210 40% 98%)',
    popover: 'hsl(222.2 84% 4.9%)',
    popoverForeground: 'hsl(210 40% 98%)',
    primary: 'hsl(217.2 91.2% 59.8%)',
    primaryForeground: 'hsl(222.2 84% 4.9%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    muted: 'hsl(217.2 32.6% 17.5%)',
    mutedForeground: 'hsl(215 20.2% 65.1%)',
    accent: 'hsl(217.2 32.6% 17.5%)',
    accentForeground: 'hsl(210 40% 98%)',
    destructive: 'hsl(0 62.8% 30.6%)',
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(217.2 32.6% 17.5%)',
    input: 'hsl(217.2 32.6% 17.5%)',
    ring: 'hsl(224.3 76.3% 94.1%)',
  }
}

// =============================================
// UTILITIES ET HELPERS
// =============================================

class ThemeStorage {
  private static key: string = 'topsteel-theme'
  private static fallback: Theme = 'system'

  static setKey(key: string): void {
    this.key = key
  }

  static get(): Theme {
    if (typeof window === 'undefined') return this.fallback

    try {
      const stored = localStorage.getItem(this.key) as Theme
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored
      }
      return this.fallback
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error)
      return this.fallback
    }
  }

  static set(theme: Theme): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.setItem(this.key, theme)
      
      // Dispatch custom event for cross-tab sync
      window.dispatchEvent(new CustomEvent('theme-changed', { 
        detail: { theme } 
      }))
      
      return true
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
      return false
    }
  }

  static remove(): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.removeItem(this.key)
      return true
    } catch (error) {
      console.warn('Failed to remove theme from localStorage:', error)
      return false
    }
  }
}

class ThemeApplicator {
  private static transitionStyle: HTMLStyleElement | null = null

  static setupTransitions(duration: number): void {
    if (typeof document === 'undefined') return

    if (!this.transitionStyle) {
      this.transitionStyle = document.createElement('style')
      this.transitionStyle.type = 'text/css'
      document.head.appendChild(this.transitionStyle)
    }

    this.transitionStyle.textContent = `
      *, *::before, *::after {
        transition: background-color ${duration}ms ease-in-out,
                   border-color ${duration}ms ease-in-out,
                   color ${duration}ms ease-in-out,
                   fill ${duration}ms ease-in-out,
                   stroke ${duration}ms ease-in-out;
      }
    `
  }

  static removeTransitions(): void {
    if (this.transitionStyle) {
      this.transitionStyle.remove()
      this.transitionStyle = null
    }
  }

  static applyTheme(
    theme: ResolvedTheme, 
    attribute: 'class' | 'data-theme' = 'class',
    colors?: ThemeColors
  ): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Apply theme attribute
    if (attribute === 'class') {
      root.classList.toggle('dark', theme === 'dark')
      root.classList.toggle('light', theme === 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }

    // Apply CSS custom properties
    if (colors) {
      Object.entries(colors).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        root.style.setProperty(cssVar, value)
      })
    }
  }

  static getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light'
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}

class ThemeMetricsCollector {
  private static metrics: ThemeMetrics = {
    changeCount: 0,
    lastChange: 0,
    errors: 0,
    hydrationTime: 0,
    transitionCount: 0,
    storageErrors: 0
  }

  static recordThemeChange(): void {
    this.metrics.changeCount++
    this.metrics.lastChange = Date.now()
  }

  static recordError(): void {
    this.metrics.errors++
  }

  static recordHydration(time: number): void {
    this.metrics.hydrationTime = time
  }

  static recordTransition(): void {
    this.metrics.transitionCount++
  }

  static recordStorageError(): void {
    this.metrics.storageErrors++
  }

  static getMetrics(): ThemeMetrics {
    return { ...this.metrics }
  }

  static reset(): void {
    this.metrics = {
      changeCount: 0,
      lastChange: 0,
      errors: 0,
      hydrationTime: 0,
      transitionCount: 0,
      storageErrors: 0
    }
  }
}

// =============================================
// CONTEXT
// =============================================

const ThemeProviderContext = createContext<ThemeProviderContext | undefined>(undefined)

// =============================================
// PROVIDER COMPONENT
// =============================================

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'topsteel-theme',
  attribute = 'class',
  enableSystem = true,
  enableTransitions = true,
  enableMetrics = true,
  enableSync = true,
  transitionDuration = 150,
  fallbackTheme = 'light',
  customColors = {}
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(fallbackTheme)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const mediaQueryRef = useRef<MediaQueryList | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hydrationStartRef = useRef<number>(Date.now())

  // Initialize storage key
  useEffect(() => {
    ThemeStorage.setKey(storageKey)
  }, [storageKey])

  // Setup transitions
  useEffect(() => {
    if (enableTransitions) {
      ThemeApplicator.setupTransitions(transitionDuration)
    }
    
    return () => {
      if (enableTransitions) {
        ThemeApplicator.removeTransitions()
      }
    }
  }, [enableTransitions, transitionDuration])

  // Resolve theme function
  const resolveTheme = useCallback((currentTheme: Theme): ResolvedTheme => {
    if (currentTheme === 'system') {
      return enableSystem ? ThemeApplicator.getSystemTheme() : fallbackTheme
    }
    return currentTheme as ResolvedTheme
  }, [enableSystem, fallbackTheme])

  // Update resolved theme and apply
  const updateResolvedTheme = useCallback((newTheme: Theme) => {
    const resolved = resolveTheme(newTheme)
    
    setResolvedTheme(resolved)
    
    // Get colors (merge defaults with custom colors)
    const colors = {
      ...DEFAULT_COLORS[resolved],
      ...customColors[resolved]
    }
    
    // Apply theme
    ThemeApplicator.applyTheme(resolved, attribute, colors)
    
    if (enableMetrics) {
      ThemeMetricsCollector.recordTransition()
    }
  }, [resolveTheme, attribute, customColors, enableMetrics])

  // Set theme with validation and side effects
  const setTheme = useCallback((newTheme: Theme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`)
      return
    }

    setIsChanging(true)
    
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      setThemeState(newTheme)
      updateResolvedTheme(newTheme)
      
      // Save to storage
      const saved = ThemeStorage.set(newTheme)
      if (!saved && enableMetrics) {
        ThemeMetricsCollector.recordStorageError()
      }
      
      if (enableMetrics) {
        ThemeMetricsCollector.recordThemeChange()
      }
      
    } catch (error) {
      console.error('Failed to set theme:', error)
      if (enableMetrics) {
        ThemeMetricsCollector.recordError()
      }
    }

    // Reset changing state after transition
    timeoutRef.current = setTimeout(() => {
      setIsChanging(false)
    }, transitionDuration + 50)
  }, [updateResolvedTheme, enableMetrics, transitionDuration])

  // Initial hydration
  useEffect(() => {
    const hydrationStart = hydrationStartRef.current
    
    try {
      // Get initial theme from storage or use default
      const storedTheme = ThemeStorage.get()
      const initialTheme = storedTheme || defaultTheme
      
      setThemeState(initialTheme)
      updateResolvedTheme(initialTheme)
      
      setIsHydrated(true)
      
      if (enableMetrics) {
        ThemeMetricsCollector.recordHydration(Date.now() - hydrationStart)
      }
      
    } catch (error) {
      console.error('Theme hydration failed:', error)
      
      // Fallback to default theme
      setThemeState(defaultTheme)
      updateResolvedTheme(defaultTheme)
      setIsHydrated(true)
      
      if (enableMetrics) {
        ThemeMetricsCollector.recordError()
      }
    }
  }, [defaultTheme, updateResolvedTheme, enableMetrics])

  // System theme change listener
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryRef.current = mediaQuery
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        updateResolvedTheme('system')
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [theme, enableSystem, updateResolvedTheme])

  // Cross-tab synchronization
  useEffect(() => {
    if (!enableSync || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const newTheme = e.newValue as Theme
        if (['light', 'dark', 'system'].includes(newTheme)) {
          setThemeState(newTheme)
          updateResolvedTheme(newTheme)
        }
      }
    }

    const handleCustomThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail?.theme as Theme
      if (newTheme && ['light', 'dark', 'system'].includes(newTheme)) {
        setThemeState(newTheme)
        updateResolvedTheme(newTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('theme-changed', handleCustomThemeChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-changed', handleCustomThemeChange as EventListener)
    }
  }, [storageKey, enableSync, updateResolvedTheme])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Utility functions
  const toggleTheme = useCallback(() => {
    if (theme === 'system') {
      const systemTheme = ThemeApplicator.getSystemTheme()
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }, [theme, setTheme])

  const setSystemTheme = useCallback(() => {
    setTheme('system')
  }, [setTheme])

  const clearTheme = useCallback(() => {
    ThemeStorage.remove()
    setTheme(defaultTheme)
  }, [setTheme, defaultTheme])

  // Derived values
  const isSystemTheme = theme === 'system'
  const colors = {
    ...DEFAULT_COLORS[resolvedTheme],
    ...customColors[resolvedTheme]
  }
  const metrics = enableMetrics ? ThemeMetricsCollector.getMetrics() : {
    changeCount: 0,
    lastChange: 0,
    errors: 0,
    hydrationTime: 0,
    transitionCount: 0,
    storageErrors: 0
  }

  // Context value
  const contextValue: ThemeProviderContext = {
    theme,
    setTheme,
    resolvedTheme,
    isHydrated,
    isChanging,
    isSystemTheme,
    metrics,
    colors,
    toggleTheme,
    setSystemTheme,
    clearTheme
  }

  return (
    <ThemeProviderContext.Provider value={contextValue}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// =============================================
// HOOK
// =============================================

export function useTheme(): ThemeProviderContext {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

// =============================================
// UTILITIES POUR DEBUG ET MONITORING
// =============================================

export function useThemeMetrics(): ThemeMetrics {
  const { metrics } = useTheme()
  return metrics
}

export function useThemeDebug(): {
  logMetrics: () => void
  resetMetrics: () => void
  getCurrentTheme: () => { theme: Theme; resolved: ResolvedTheme }
  testThemeSwitch: () => void
} {
  const { theme, resolvedTheme, toggleTheme } = useTheme()

  const logMetrics = useCallback(() => {
    const metrics = ThemeMetricsCollector.getMetrics()
    console.table(metrics)
  }, [])

  const resetMetrics = useCallback(() => {
    ThemeMetricsCollector.reset()
  }, [])

  const getCurrentTheme = useCallback(() => ({
    theme,
    resolved: resolvedTheme
  }), [theme, resolvedTheme])

  const testThemeSwitch = useCallback(() => {
    console.log('Testing theme switch...')
    toggleTheme()
    setTimeout(() => {
      toggleTheme()
    }, 1000)
  }, [toggleTheme])

  return {
    logMetrics,
    resetMetrics,
    getCurrentTheme,
    testThemeSwitch
  }
}