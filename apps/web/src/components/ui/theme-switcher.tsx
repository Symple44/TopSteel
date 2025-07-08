'use client'

import { cn } from '@/lib/utils'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface ThemeSwitcherProps {
  variant?: 'icon' | 'dropdown' | 'toggle'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

// Hook pour gérer le thème de manière sécurisée
function useThemeContext() {
  const [themeState, setThemeState] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    resolvedTheme: 'light' as 'light' | 'dark',
    isHydrated: false,
    error: null as string | null,
  })

  useEffect(() => {
    // Détection du thème système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const systemTheme = mediaQuery.matches ? 'dark' : 'light'

    // Lecture du thème stocké
    const storedTheme =
      (localStorage.getItem('topsteel-theme') as 'light' | 'dark' | 'system') || 'system'

    const resolvedTheme = storedTheme === 'system' ? systemTheme : storedTheme

    setThemeState({
      theme: storedTheme,
      resolvedTheme,
      isHydrated: true,
      error: null,
    })

    // Appliquer le thème au DOM
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolvedTheme)

    // Écouter les changements système
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (storedTheme === 'system') {
        const newSystemTheme = e.matches ? 'dark' : 'light'

        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(newSystemTheme)
        setThemeState((prev) => ({ ...prev, resolvedTheme: newSystemTheme }))
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)

    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [])

  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    try {
      localStorage.setItem('topsteel-theme', newTheme)

      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      const resolvedTheme = newTheme === 'system' ? systemTheme : newTheme

      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(resolvedTheme)

      setThemeState((prev) => ({
        ...prev,
        theme: newTheme,
        resolvedTheme,
        error: null,
      }))
    } catch (error) {
      setThemeState((prev) => ({
        ...prev,
        error: 'Erreur lors du changement de thème',
      }))
    }
  }, [])

  return { ...themeState, setTheme }
}

export function ThemeSwitcher({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className,
}: ThemeSwitcherProps) {
  // ✅ HOOK TOUJOURS APPELÉ EN PREMIER
  const { theme, resolvedTheme, isHydrated, error, setTheme } = useThemeContext()

  // ✅ TOUS LES AUTRES HOOKS APRÈS
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // ✅ useCallback TOUJOURS APPELÉS
  const handleThemeChange = useCallback(
    (newTheme: 'light' | 'dark' | 'system') => {
      setTheme(newTheme)
      setIsOpen(false)
    },
    [setTheme]
  )

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const getThemeIcon = useCallback(() => {
    if (!isHydrated || !mounted) {
      return <Monitor className={getIconSizeClasses(size)} />
    }

    switch (resolvedTheme) {
      case 'dark':
        return <Moon className={getIconSizeClasses(size)} />
      case 'light':
        return <Sun className={getIconSizeClasses(size)} />
      default:
        return <Monitor className={getIconSizeClasses(size)} />
    }
  }, [resolvedTheme, isHydrated, mounted, size])

  const handleToggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    handleThemeChange(newTheme)
  }, [resolvedTheme, handleThemeChange])

  // ✅ useEffect APRÈS tous les hooks
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ RENDU CONDITIONNEL BASÉ SUR L'ÉTAT, PAS LES HOOKS
  if (!mounted || !isHydrated) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center justify-center rounded-lg border border-input bg-background transition-colors',
          'hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed',
          getSizeClasses(size),
          className
        )}
        title="Chargement du thème..."
      >
        <Monitor className={getIconSizeClasses(size)} />
        {showLabel && <span className="ml-2 text-sm">Thème</span>}
      </button>
    )
  }

  if (error) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center justify-center rounded-lg border border-input bg-background transition-colors',
          'hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed',
          getSizeClasses(size),
          className
        )}
        title={error}
      >
        <Monitor className={getIconSizeClasses(size)} />
        {showLabel && <span className="ml-2 text-sm">Erreur</span>}
      </button>
    )
  }

  if (variant === 'toggle') {
    return (
      <button
        onClick={handleToggleTheme}
        className={cn(
          'inline-flex items-center justify-center rounded-lg border border-input bg-background transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          getSizeClasses(size),
          className
        )}
        aria-label={`Basculer vers le thème ${resolvedTheme === 'dark' ? 'clair' : 'sombre'}`}
      >
        {getThemeIcon()}
        {showLabel && (
          <span className="ml-2 text-sm">{resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}</span>
        )}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={cn(
          'inline-flex items-center justify-center rounded-lg border border-input bg-background transition-all duration-200',
          'hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          getSizeClasses(size),
          className
        )}
        aria-label="Sélectionner le thème"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {getThemeIcon()}
        {showLabel && <span className="ml-2 text-sm">Thème</span>}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-40 z-50 bg-popover border border-border rounded-lg shadow-lg py-1">
            <ThemeOption
              theme="light"
              currentTheme={theme}
              icon={<Sun className="h-4 w-4" />}
              label="Clair"
              onClick={handleThemeChange}
            />

            <ThemeOption
              theme="dark"
              currentTheme={theme}
              icon={<Moon className="h-4 w-4" />}
              label="Sombre"
              onClick={handleThemeChange}
            />

            <ThemeOption
              theme="system"
              currentTheme={theme}
              icon={<Monitor className="h-4 w-4" />}
              label="Système"
              onClick={handleThemeChange}
            />
          </div>
        </>
      )}
    </div>
  )
}

interface ThemeOptionProps {
  theme: 'light' | 'dark' | 'system'
  currentTheme: string
  icon: React.ReactNode
  label: string
  onClick: (theme: 'light' | 'dark' | 'system') => void
}

function ThemeOption({ theme, currentTheme, icon, label, onClick }: ThemeOptionProps) {
  return (
    <button
      onClick={() => onClick(theme)}
      className={cn(
        'w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-3',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none',
        currentTheme === theme && 'bg-accent/50'
      )}
      role="menuitem"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {currentTheme === theme && <div className="h-2 w-2 bg-primary rounded-full" />}
    </button>
  )
}

function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'h-8 w-8 px-2'
    case 'lg':
      return 'h-12 w-12 px-3'
    default:
      return 'h-10 w-10 px-2.5'
  }
}

function getIconSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'h-3.5 w-3.5'
    case 'lg':
      return 'h-5 w-5'
    default:
      return 'h-4 w-4'
  }
}
