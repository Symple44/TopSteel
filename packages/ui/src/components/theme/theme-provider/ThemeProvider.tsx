/**
 * 🎨 THEME PROVIDER UNIFIÉ - TOPSTEEL ERP
 * Provider de thème robuste basé sur next-themes avec intégration design system
 * Fusion des 3 providers existants pour une solution unifiée et maintenable
 */

'use client'

import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes'
import * as React from 'react'
import { createContext, useContext } from 'react'
import type { ResolvedTheme, ThemeConfig } from '../../../design-system'
import { darkTheme, lightTheme, vibrantTheme } from '../../../design-system'

// ===== TYPES UNIFIÉS =====

export type Theme = 'light' | 'dark' | 'vibrant' | 'system'

interface TopSteelThemeProviderProps {
  children: React.ReactNode
  /**
   * Thème par défaut
   * @default 'vibrant'
   */
  defaultTheme?: Theme
  /**
   * Clé de stockage localStorage
   * @default 'topsteel-theme'
   */
  storageKey?: string
  /**
   * Activer la détection du thème système
   * @default true
   */
  enableSystem?: boolean
  /**
   * Désactiver les transitions lors du changement
   * @default false
   */
  disableTransitionOnChange?: boolean
  /**
   * Thèmes supportés
   * @default ['light', 'dark', 'vibrant', 'system']
   */
  themes?: Theme[]
  /**
   * Forcer l'activation du thème
   * @default false
   */
  forcedTheme?: Theme
  /**
   * Attribut à utiliser pour appliquer le thème
   * @default 'class'
   */
  attribute?: 'class' | 'data-theme'
}

interface TopSteelThemeContextValue {
  /** Thème actuel (peut être 'system') */
  theme: Theme
  /** Thème résolu (jamais 'system') */
  resolvedTheme: ResolvedTheme
  /** Fonction pour changer le thème */
  setTheme: (theme: Theme) => void
  /** Liste des thèmes disponibles */
  themes: Theme[]
  /** Configuration des thèmes */
  themeConfigs: Record<ResolvedTheme, ThemeConfig>
  /** Si le système est en cours de montage */
  systemTheme: ResolvedTheme
}

// ===== CONFIGURATIONS DES THÈMES =====

// Utilisation des thèmes du design system existant
export const themeConfigs: Record<ResolvedTheme, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
  vibrant: vibrantTheme,
}

// ===== CONTEXT =====

const ThemeContext = createContext<TopSteelThemeContextValue | undefined>(undefined)

// ===== HOOK =====

export function useTheme(): TopSteelThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// ===== PROVIDER COMPONENT =====

export function ThemeProvider({
  children,
  defaultTheme = 'vibrant',
  storageKey = 'topsteel-theme',
  enableSystem = true,
  disableTransitionOnChange = false,
  themes = ['light', 'dark', 'vibrant', 'system'],
  forcedTheme,
  attribute = 'class',
  ...props
}: TopSteelThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      storageKey={storageKey}
      themes={themes}
      forcedTheme={forcedTheme}
      {...props}
    >
      <ThemeProviderContent themes={themes}>{children}</ThemeProviderContent>
    </NextThemeProvider>
  )
}

// ===== PROVIDER CONTENT =====

interface ThemeProviderContentProps {
  children: React.ReactNode
  themes: Theme[]
}

function ThemeProviderContent({ children, themes }: ThemeProviderContentProps) {
  const { theme, resolvedTheme, setTheme, systemTheme } = useNextTheme()

  // Appliquer les CSS variables pour le thème actuel
  React.useEffect(() => {
    const root = document.documentElement
    const currentTheme = (resolvedTheme || 'light') as ResolvedTheme
    const config = themeConfigs[currentTheme]

    if (config) {
      // Appliquer les couleurs CSS variables
      Object.entries(config.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })
    }
  }, [resolvedTheme])

  const contextValue: TopSteelThemeContextValue = {
    theme: theme as Theme,
    resolvedTheme: (resolvedTheme || 'light') as ResolvedTheme,
    setTheme,
    themes,
    themeConfigs,
    systemTheme: (systemTheme || 'light') as ResolvedTheme,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

// ===== EXPORTS =====

export { ThemeProvider as default }
export type { TopSteelThemeProviderProps, TopSteelThemeContextValue }
