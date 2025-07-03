'use client'

import { useTheme } from '@/components/providers/theme-provider'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  variant?: 'icon' | 'dropdown' | 'toggle'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ThemeSwitcher({ 
  variant = 'icon',
  size = 'md', 
  showLabel = false,
  className 
}: ThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  let themeContext
  try {
    themeContext = useTheme()
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Theme context error')
    themeContext = null
  }

  if (!mounted || !themeContext || error) {
    return (
      <button 
        disabled
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-input bg-background transition-colors",
          "hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed",
          getSizeClasses(size),
          className
        )}
        title={error || "Chargement du thème..."}
      >
        <Monitor className={getIconSizeClasses(size)} />
        {showLabel && <span className="ml-2 text-sm">Thème</span>}
      </button>
    )
  }

  const { theme, setTheme, resolvedTheme, isHydrated } = themeContext

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    try {
      setTheme(newTheme)
      setIsOpen(false)
      setError(null)
    } catch (err) {
      setError('Erreur lors du changement de thème')
      console.error('Theme change failed:', err)
    }
  }, [setTheme])

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const getThemeIcon = useCallback(() => {
    if (!isHydrated) return <Monitor className={getIconSizeClasses(size)} />
    
    switch (resolvedTheme) {
      case 'dark': 
        return <Moon className={getIconSizeClasses(size)} />
      case 'light': 
        return <Sun className={getIconSizeClasses(size)} />
      default: 
        return <Monitor className={getIconSizeClasses(size)} />
    }
  }, [resolvedTheme, isHydrated, size])

  if (variant === 'toggle') {
    return (
      <button
        onClick={() => handleThemeChange(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-input bg-background transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          getSizeClasses(size),
          className
        )}
        aria-label={`Basculer vers le thème ${resolvedTheme === 'dark' ? 'clair' : 'sombre'}`}
      >
        {getThemeIcon()}
        {showLabel && (
          <span className="ml-2 text-sm">
            {resolvedTheme === 'dark' ? 'Sombre' : 'Clair'}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-input bg-background transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
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
        "w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-3",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
        currentTheme === theme && "bg-accent/50"
      )}
      role="menuitem"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {currentTheme === theme && (
        <div className="h-2 w-2 bg-primary rounded-full" />
      )}
    </button>
  )
}

function getSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm': return 'h-8 w-8 px-2'
    case 'lg': return 'h-12 w-12 px-3'
    default: return 'h-10 w-10 px-2.5'
  }
}

function getIconSizeClasses(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm': return 'h-3.5 w-3.5'
    case 'lg': return 'h-5 w-5'
    default: return 'h-4 w-4'
  }
}
