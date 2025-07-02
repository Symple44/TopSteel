'use client'

import { useTheme } from '@/components/providers/theme-provider'
import { Monitor, Moon, Sun, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  let themeContext
  try {
    themeContext = theme
  } catch (error) {
    themeContext = null
  }

  if (!themeContext || !mounted) {
    return (
      <button 
        disabled
        className="h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
      >
        <Monitor className="h-4 w-4" />
      </button>
    )
  }

  const { theme, setTheme, resolvedTheme, isHydrated } = themeContext

  const getIcon = () => {
    if (!isHydrated) return <Monitor className="h-4 w-4" />
    
    switch (resolvedTheme) {
      case 'dark': return <Moon className="h-4 w-4" />
      case 'light': return <Sun className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors"
      >
        {getIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-md z-50">
          <div className="p-1">
            <button
              onClick={() => {
                setTheme('light')
                setIsOpen(false)
              }}
              className="w-full px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            >
              <Sun className="h-4 w-4" />
              Clair
              {theme === 'light' && <div className="ml-auto h-2 w-2 bg-primary rounded-full" />}
            </button>
            
            <button
              onClick={() => {
                setTheme('dark')
                setIsOpen(false)
              }}
              className="w-full px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            >
              <Moon className="h-4 w-4" />
              Sombre
              {theme === 'dark' && <div className="ml-auto h-2 w-2 bg-primary rounded-full" />}
            </button>
            
            <button
              onClick={() => {
                setTheme('system')
                setIsOpen(false)
              }}
              className="w-full px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              Système
              {theme === 'system' && <div className="ml-auto h-2 w-2 bg-primary rounded-full" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


