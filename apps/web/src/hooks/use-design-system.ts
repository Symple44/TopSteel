// apps/web/src/hooks/use-design-system.ts
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'

/**
 * Hook pour utiliser le design system TopSteel
 * Version corrigée sans dépendances sur @/lib/styles
 */
export function useDesignSystem() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [animations, setAnimations] = useState(true)
  
  // Gestion du thème
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const storedTheme = localStorage.getItem('topsteel-theme') as 'light' | 'dark' | 'system' || 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const systemTheme = mediaQuery.matches ? 'dark' : 'light'
    
    setTheme(storedTheme)
    setResolvedTheme(storedTheme === 'system' ? systemTheme : storedTheme)
    
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (storedTheme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }
    }
    
    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [])
  
  // Classes utilitaires pour les composants métier
  const classes = useMemo(() => ({
    // Classes de carte projet
    projectCard: cn(
      'bg-card border border-border rounded-lg shadow-sm',
      'p-6 space-y-4',
      animations && 'transition-all duration-200 hover:shadow-md'
    ),
    
    // Badge de statut dynamique
    statusBadge: (status: string) => {
      const statusStyles: Record<string, string> = {
        'EN_COURS': 'bg-blue-500 text-white',
        'TERMINE': 'bg-green-500 text-white',
        'ANNULE': 'bg-red-500 text-white',
        'BROUILLON': 'bg-gray-200 text-gray-800',
        'EN_ATTENTE': 'bg-yellow-500 text-white',
        'ACCEPTE': 'bg-blue-600 text-white',
        'REFUSE': 'bg-red-600 text-white',
      }
      
      return cn(
        'px-2 py-1 rounded-full text-xs font-medium',
        statusStyles[status] || 'bg-gray-100 text-gray-600'
      )
    },
    
    // Bouton style métallurgie
    metallurgyButton: cn(
      'bg-slate-700 text-white hover:bg-slate-800',
      'px-4 py-2 rounded-lg font-medium',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600',
      animations && 'transition-colors duration-200'
    ),
    
    // Carte avec accent métallurgie
    metallurgyCard: cn(
      'bg-card border-l-4 border-l-slate-600',
      'shadow-sm rounded-lg p-6'
    ),
    
    // Badge de priorité
    priorityBadge: (priority: string) => {
      const priorityStyles: Record<string, string> = {
        'BASSE': 'bg-green-100 text-green-800',
        'NORMALE': 'bg-blue-100 text-blue-800',
        'HAUTE': 'bg-orange-100 text-orange-800',
        'URGENTE': 'bg-red-100 text-red-800 animate-pulse',
      }
      
      return cn(
        'px-2 py-1 rounded text-xs font-medium',
        priorityStyles[priority] || 'bg-gray-100 text-gray-600'
      )
    },
    
    // Formulaire responsive
    formField: 'space-y-2',
    formGrid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    formGridWide: 'grid grid-cols-1 md:grid-cols-3 gap-4',
    
    // Tableaux responsive
    tableContainer: 'w-full overflow-auto',
    tableCell: 'px-4 py-3 text-left',
    tableCellNumeric: 'px-4 py-3 text-right font-mono',
    
    // Navigation
    navItem: cn(
      'flex items-center px-3 py-2 rounded-md text-sm font-medium',
      'hover:bg-accent hover:text-accent-foreground',
      animations && 'transition-colors duration-200'
    ),
    
    navItemActive: 'bg-accent text-accent-foreground'
  }), [animations])
  
  // Couleurs du thème TopSteel
  const colors = useMemo(() => ({
    primary: {
      50: 'hsl(221 83% 95%)',
      500: 'hsl(221 83% 53%)',
      600: 'hsl(221 83% 48%)',
      700: 'hsl(221 83% 43%)',
    },
    metallurgy: {
      50: 'hsl(210 40% 98%)',
      500: 'hsl(215 16% 47%)',
      600: 'hsl(215 19% 35%)',
      700: 'hsl(215 25% 27%)',
      800: 'hsl(217 33% 17%)',
    },
    status: {
      success: 'hsl(142 76% 36%)',
      warning: 'hsl(48 96% 53%)',
      error: 'hsl(0 84% 60%)',
      info: 'hsl(199 89% 48%)',
    },
    priority: {
      low: 'hsl(142 60% 50%)',
      medium: 'hsl(35 91% 65%)',
      high: 'hsl(25 95% 63%)',
      critical: 'hsl(0 84% 60%)',
    }
  }), [])
  
  // Méthodes utilitaires
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    setResolvedTheme(newTheme)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('topsteel-theme', newTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(newTheme)
    }
  }
  
  const toggleAnimations = () => {
    setAnimations(prev => !prev)
  }
  
  return {
    // État du thème
    theme,
    resolvedTheme,
    animations,
    
    // Classes utilitaires
    classes,
    colors,
    
    // Méthodes
    toggleTheme,
    toggleAnimations,
    
    // Utilitaires
    cn,
    
    // Design tokens simplifiés
    tokens: {
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      borderRadius: {
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      }
    }
  }
}