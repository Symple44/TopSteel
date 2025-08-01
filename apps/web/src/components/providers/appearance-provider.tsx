/**
 * Provider pour initialiser les préférences d'apparence au démarrage
 * Fichier: apps/web/src/components/providers/appearance-provider.tsx
 */

'use client'

import { type ReactNode, useEffect } from 'react'
import { useCurrentAppearanceSettings } from '@/hooks/use-appearance-settings'

interface AppearanceProviderProps {
  children: ReactNode
}

export function AppearanceProvider({ children }: AppearanceProviderProps) {
  const settings = useCurrentAppearanceSettings()

  // Appliquer les paramètres au démarrage
  useEffect(() => {
    if (!settings) return

    const root = document.documentElement

    // Appliquer la taille de police
    root.style.setProperty(
      '--font-size-multiplier',
      settings.fontSize === 'small' ? '0.875' : settings.fontSize === 'large' ? '1.125' : '1'
    )

    // Appliquer la densité
    root.style.setProperty(
      '--density-multiplier',
      settings.density === 'compact' ? '0.75' : settings.density === 'spacious' ? '1.25' : '1'
    )

    // Appliquer la largeur de sidebar
    root.style.setProperty(
      '--sidebar-width',
      settings.sidebarWidth === 'compact'
        ? '200px'
        : settings.sidebarWidth === 'wide'
          ? '320px'
          : '260px'
    )

    // Appliquer la couleur d'accent
    const accentColors = {
      blue: 'hsl(217 91% 60%)',
      green: 'hsl(142 76% 36%)',
      purple: 'hsl(270 91% 65%)',
      orange: 'hsl(45 86% 68%)',
      pink: 'hsl(340 82% 75%)',
      red: 'hsl(0 84% 60%)',
      cyan: 'hsl(189 94% 43%)',
      indigo: 'hsl(231 48% 48%)',
      teal: 'hsl(173 58% 39%)',
      yellow: 'hsl(48 96% 53%)',
      emerald: 'hsl(158 64% 52%)',
      rose: 'hsl(330 81% 60%)',
    }

    if (accentColors[settings.accentColor]) {
      root.style.setProperty('--accent-color', accentColors[settings.accentColor])
    }

    // Appliquer les classes CSS
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
    document.body.classList.add(`density-${settings.density}`)

    document.body.classList.remove('font-small', 'font-medium', 'font-large')
    document.body.classList.add(`font-${settings.fontSize}`)
  }, [settings])

  return <>{children}</>
}
