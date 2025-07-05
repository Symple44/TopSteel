/**
 * 🎨 DESIGN SYSTEM HOOK ENTERPRISE - TOPSTEEL ERP
 * Version optimisée pour performance et évolutivité
 * 
 * Fonctionnalités:
 * - Cache intelligent des styles
 * - Thème adaptatif automatique
 * - Classes métier pré-calculées
 * - Performance monitoring
 * - Extensibilité modulaire
 * - SSR-Safe
 */

import { cn } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// =============================================
// TYPES ET INTERFACES
// =============================================

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
export type AnimationLevel = 'none' | 'reduced' | 'full'
export type Density = 'compact' | 'comfortable' | 'spacious'

export interface StatusConfig {
  color: string
  bgColor: string
  textColor: string
  icon?: string
  priority: number
}

export interface DesignSystemConfig {
  theme: ThemeMode
  animations: AnimationLevel
  density: Density
  reducedMotion: boolean
  highContrast: boolean
  fontSize: 'small' | 'medium' | 'large'
  borderRadius: 'none' | 'small' | 'medium' | 'large'
}

export interface DesignSystemMetrics {
  themeSwitches: number
  classGenerations: number
  cacheHits: number
  performanceMs: number[]
}

export interface ClassVariants {
  size: 'sm' | 'md' | 'lg' | 'xl'
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  status: keyof typeof STATUS_CONFIGS
}

// =============================================
// CONFIGURATIONS MÉTIER ERP
// =============================================

export const STATUS_CONFIGS = {
  // Projets
  EN_COURS: {
    color: 'blue-500',
    bgColor: 'blue-50',
    textColor: 'blue-700',
    icon: 'play-circle',
    priority: 1
  },
  TERMINE: {
    color: 'green-500',
    bgColor: 'green-50',
    textColor: 'green-700',
    icon: 'check-circle',
    priority: 5
  },
  ANNULE: {
    color: 'red-500',
    bgColor: 'red-50',
    textColor: 'red-700',
    icon: 'x-circle',
    priority: 0
  },
  BROUILLON: {
    color: 'gray-400',
    bgColor: 'gray-50',
    textColor: 'gray-600',
    icon: 'edit',
    priority: 2
  },
  
  // Devis
  EN_ATTENTE: {
    color: 'yellow-500',
    bgColor: 'yellow-50',
    textColor: 'yellow-700',
    icon: 'clock',
    priority: 3
  },
  ACCEPTE: {
    color: 'blue-600',
    bgColor: 'blue-50',
    textColor: 'blue-800',
    icon: 'thumbs-up',
    priority: 4
  },
  REFUSE: {
    color: 'red-600',
    bgColor: 'red-50',
    textColor: 'red-800',
    icon: 'thumbs-down',
    priority: 1
  },
  
  // Production
  PLANIFIE: {
    color: 'indigo-500',
    bgColor: 'indigo-50',
    textColor: 'indigo-700',
    icon: 'calendar',
    priority: 2
  },
  EN_PRODUCTION: {
    color: 'orange-500',
    bgColor: 'orange-50',
    textColor: 'orange-700',
    icon: 'cog',
    priority: 3
  },
  CONTROLE_QUALITE: {
    color: 'purple-500',
    bgColor: 'purple-50',
    textColor: 'purple-700',
    icon: 'shield-check',
    priority: 4
  },
  
  // Stock
  EN_STOCK: {
    color: 'emerald-500',
    bgColor: 'emerald-50',
    textColor: 'emerald-700',
    icon: 'package',
    priority: 5
  },
  RUPTURE: {
    color: 'red-500',
    bgColor: 'red-50',
    textColor: 'red-700',
    icon: 'alert-triangle',
    priority: 0
  },
  STOCK_FAIBLE: {
    color: 'amber-500',
    bgColor: 'amber-50',
    textColor: 'amber-700',
    icon: 'alert-circle',
    priority: 1
  }
} as const

export const DENSITY_CONFIGS = {
  compact: {
    padding: 'p-2',
    gap: 'gap-1',
    text: 'text-sm',
    height: 'h-8'
  },
  comfortable: {
    padding: 'p-4',
    gap: 'gap-3',
    text: 'text-base',
    height: 'h-10'
  },
  spacious: {
    padding: 'p-6',
    gap: 'gap-4',
    text: 'text-lg',
    height: 'h-12'
  }
} as const

export const ANIMATION_CONFIGS = {
  none: {
    transition: '',
    hover: '',
    enter: '',
    exit: ''
  },
  reduced: {
    transition: 'transition-colors duration-150',
    hover: 'hover:bg-opacity-80',
    enter: 'animate-in fade-in duration-150',
    exit: 'animate-out fade-out duration-150'
  },
  full: {
    transition: 'transition-all duration-200 ease-in-out',
    hover: 'hover:scale-105 hover:shadow-md',
    enter: 'animate-in fade-in slide-in-from-bottom-2 duration-300',
    exit: 'animate-out fade-out slide-out-to-bottom-2 duration-200'
  }
} as const

// =============================================
// CACHE ET PERFORMANCE
// =============================================

class DesignSystemCache {
  private static classCache = new Map<string, string>()
  private static configCache = new Map<string, DesignSystemConfig>()
  private static maxCacheSize = 500
  private static metrics: DesignSystemMetrics = {
    themeSwitches: 0,
    classGenerations: 0,
    cacheHits: 0,
    performanceMs: []
  }

  static getClass(key: string): string | undefined {
    const result = this.classCache.get(key)
    if (result) {
      this.metrics.cacheHits++
    }
    return result
  }

  static setClass(key: string, value: string): void {
    if (this.classCache.size >= this.maxCacheSize) {
      const firstKey = this.classCache.keys().next().value
      this.classCache.delete(firstKey)
    }
    this.classCache.set(key, value)
  }

  static getConfig(key: string): DesignSystemConfig | undefined {
    return this.configCache.get(key)
  }

  static setConfig(key: string, config: DesignSystemConfig): void {
    this.configCache.set(key, config)
  }

  static recordThemeSwitch(): void {
    this.metrics.themeSwitches++
  }

  static recordClassGeneration(timeMs: number): void {
    this.metrics.classGenerations++
    this.metrics.performanceMs.push(timeMs)
    
    if (this.metrics.performanceMs.length > 100) {
      this.metrics.performanceMs = this.metrics.performanceMs.slice(-100)
    }
  }

  static getMetrics(): DesignSystemMetrics {
    return { ...this.metrics }
  }

  static clear(): void {
    this.classCache.clear()
    this.configCache.clear()
  }
}

// =============================================
// GÉNÉRATEUR DE CLASSES OPTIMISÉ
// =============================================

class ClassGenerator {
  /**
   * Génère les classes pour une carte projet optimisée
   */
  static projectCard(config: DesignSystemConfig): string {
    const cacheKey = `projectCard-${JSON.stringify(config)}`
    const cached = DesignSystemCache.getClass(cacheKey)
    if (cached) return cached
    
    const startTime = performance.now()
    
    const densityConfig = DENSITY_CONFIGS[config.density]
    const animationConfig = ANIMATION_CONFIGS[config.animations]
    
    const classes = cn(
      // Base
      'bg-card border border-border rounded-lg shadow-sm',
      
      // Density
      densityConfig.padding,
      densityConfig.gap,
      
      // Animations
      animationConfig.transition,
      config.animations !== 'none' && 'hover:shadow-md',
      
      // Accessibility
      config.highContrast && 'ring-2 ring-offset-2 ring-blue-500/20',
      
      // Border radius
      config.borderRadius === 'none' && 'rounded-none',
      config.borderRadius === 'small' && 'rounded-sm',
      config.borderRadius === 'large' && 'rounded-xl',
      
      // Dark mode
      'dark:bg-card-dark dark:border-border-dark'
    )
    
    DesignSystemCache.recordClassGeneration(performance.now() - startTime)
    DesignSystemCache.setClass(cacheKey, classes)
    return classes
  }

  /**
   * Génère le badge de statut avec configuration complète
   */
  static statusBadge(status: keyof typeof STATUS_CONFIGS, config: DesignSystemConfig): string {
    const cacheKey = `statusBadge-${status}-${JSON.stringify(config)}`
    const cached = DesignSystemCache.getClass(cacheKey)
    if (cached) return cached
    
    const startTime = performance.now()
    
    const statusConfig = STATUS_CONFIGS[status]
    const densityConfig = DENSITY_CONFIGS[config.density]
    const animationConfig = ANIMATION_CONFIGS[config.animations]
    
    if (!statusConfig) {
      console.warn(`Status "${status}" not found in STATUS_CONFIGS`)
      return 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
    }
    
    const classes = cn(
      // Base
      'inline-flex items-center rounded-full font-medium',
      
      // Size based on density
      config.density === 'compact' && 'px-1.5 py-0.5 text-xs',
      config.density === 'comfortable' && 'px-2 py-1 text-sm',
      config.density === 'spacious' && 'px-3 py-1.5 text-base',
      
      // Colors
      `bg-${statusConfig.bgColor}`,
      `text-${statusConfig.textColor}`,
      `border border-${statusConfig.color}/20`,
      
      // Animations
      animationConfig.transition,
      
      // High contrast
      config.highContrast && `ring-1 ring-${statusConfig.color}`,
      
      // Dark mode
      `dark:bg-${statusConfig.color}/10`,
      `dark:text-${statusConfig.color}/90`,
      `dark:border-${statusConfig.color}/30`
    )
    
    DesignSystemCache.recordClassGeneration(performance.now() - startTime)
    DesignSystemCache.setClass(cacheKey, classes)
    return classes
  }

  /**
   * Bouton style métallurgie
   */
  static metallurgyButton(variant: ClassVariants['variant'], size: ClassVariants['size'], config: DesignSystemConfig): string {
    const cacheKey = `metallurgyButton-${variant}-${size}-${JSON.stringify(config)}`
    const cached = DesignSystemCache.getClass(cacheKey)
    if (cached) return cached
    
    const startTime = performance.now()
    
    const animationConfig = ANIMATION_CONFIGS[config.animations]
    
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium rounded-md',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50',
      animationConfig.transition
    )
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-8 text-base',
      xl: 'h-12 px-10 text-lg'
    }
    
    const variantClasses = {
      default: cn(
        'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg',
        'hover:from-slate-700 hover:to-slate-800',
        'dark:from-slate-100 dark:to-slate-200 dark:text-slate-900',
        animationConfig.hover
      ),
      secondary: cn(
        'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 border border-slate-300',
        'hover:from-slate-200 hover:to-slate-300',
        'dark:from-slate-800 dark:to-slate-700 dark:text-slate-100',
        animationConfig.hover
      ),
      destructive: cn(
        'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg',
        'hover:from-red-500 hover:to-red-600',
        animationConfig.hover
      ),
      outline: cn(
        'border-2 border-slate-300 bg-transparent text-slate-700',
        'hover:bg-slate-100 hover:border-slate-400',
        'dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800',
        animationConfig.hover
      ),
      ghost: cn(
        'text-slate-700 hover:bg-slate-100',
        'dark:text-slate-300 dark:hover:bg-slate-800',
        animationConfig.hover
      )
    }
    
    const classes = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      config.highContrast && 'ring-2 ring-offset-2 ring-blue-500/20'
    )
    
    DesignSystemCache.recordClassGeneration(performance.now() - startTime)
    DesignSystemCache.setClass(cacheKey, classes)
    return classes
  }

  /**
   * Table de données ERP
   */
  static dataTable(config: DesignSystemConfig): string {
    const cacheKey = `dataTable-${JSON.stringify(config)}`
    const cached = DesignSystemCache.getClass(cacheKey)
    if (cached) return cached
    
    const startTime = performance.now()
    
    const densityConfig = DENSITY_CONFIGS[config.density]
    const animationConfig = ANIMATION_CONFIGS[config.animations]
    
    const classes = cn(
      // Base
      'w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden',
      
      // Border
      'border border-border',
      
      // Density
      '[&_th]:' + densityConfig.padding,
      '[&_td]:' + densityConfig.padding,
      '[&_th]:' + densityConfig.text,
      '[&_td]:' + densityConfig.text,
      
      // Hover effects
      '[&_tbody_tr]:' + animationConfig.transition,
      config.animations !== 'none' && '[&_tbody_tr:hover]:bg-muted/50',
      
      // Striped rows
      '[&_tbody_tr:nth-child(even)]:bg-muted/25',
      
      // Header
      '[&_thead_tr]:bg-muted',
      '[&_thead_th]:font-semibold [&_thead_th]:text-left',
      '[&_thead_th]:border-b [&_thead_th]:border-border',
      
      // Dark mode
      'dark:bg-card-dark dark:border-border-dark',
      '[&_thead_tr]:dark:bg-muted-dark',
      '[&_tbody_tr:nth-child(even)]:dark:bg-muted-dark/25',
      '[&_tbody_tr:hover]:dark:bg-muted-dark/50'
    )
    
    DesignSystemCache.recordClassGeneration(performance.now() - startTime)
    DesignSystemCache.setClass(cacheKey, classes)
    return classes
  }
}

// =============================================
// HOOK PRINCIPAL
// =============================================

export function useDesignSystem() {
  // Configuration state
  const [config, setConfig] = useState<DesignSystemConfig>(() => {
    const defaultConfig: DesignSystemConfig = {
      theme: 'system',
      animations: 'full',
      density: 'comfortable',
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium',
      borderRadius: 'medium'
    }
    
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('topsteel-design-config')
        return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig
      } catch {
        return defaultConfig
      }
    }
    
    return defaultConfig
  })

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [isHydrated, setIsHydrated] = useState(false)
  const previousConfigRef = useRef<DesignSystemConfig>(config)

  // Theme resolution
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const resolveTheme = (): ResolvedTheme => {
      if (config.theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return config.theme as ResolvedTheme
    }
    
    const updateResolvedTheme = () => {
      const newTheme = resolveTheme()
      setResolvedTheme(newTheme)
      
      // Update document class
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
    
    updateResolvedTheme()
    setIsHydrated(true)
    
    // Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (config.theme === 'system') {
        updateResolvedTheme()
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [config.theme])

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotion = () => {
      setConfig(prev => ({
        ...prev,
        reducedMotion: mediaQuery.matches,
        animations: mediaQuery.matches ? 'reduced' : prev.animations
      }))
    }
    
    updateReducedMotion()
    mediaQuery.addEventListener('change', updateReducedMotion)
    return () => mediaQuery.removeEventListener('change', updateReducedMotion)
  }, [])

  // Save config to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return
    
    try {
      localStorage.setItem('topsteel-design-config', JSON.stringify(config))
      
      // Track theme switches
      if (previousConfigRef.current.theme !== config.theme) {
        DesignSystemCache.recordThemeSwitch()
      }
      
      previousConfigRef.current = config
    } catch (error) {
      console.warn('Failed to save design system config:', error)
    }
  }, [config, isHydrated])

  // Memoized class generators
  const classes = useMemo(() => ({
    projectCard: () => ClassGenerator.projectCard(config),
    statusBadge: (status: keyof typeof STATUS_CONFIGS) => ClassGenerator.statusBadge(status, config),
    metallurgyButton: (variant: ClassVariants['variant'] = 'default', size: ClassVariants['size'] = 'md') => 
      ClassGenerator.metallurgyButton(variant, size, config),
    dataTable: () => ClassGenerator.dataTable(config)
  }), [config])

  // Update functions
  const updateConfig = useCallback((updates: Partial<DesignSystemConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const setTheme = useCallback((theme: ThemeMode) => {
    updateConfig({ theme })
  }, [updateConfig])

  const setAnimations = useCallback((animations: AnimationLevel) => {
    updateConfig({ animations })
  }, [updateConfig])

  const setDensity = useCallback((density: Density) => {
    updateConfig({ density })
  }, [updateConfig])

  // Utility functions
  const getStatusConfig = useCallback((status: keyof typeof STATUS_CONFIGS) => {
    return STATUS_CONFIGS[status]
  }, [])

  const getStatusPriority = useCallback((status: keyof typeof STATUS_CONFIGS): number => {
    return STATUS_CONFIGS[status]?.priority ?? 0
  }, [])

  const sortByStatusPriority = useCallback(<T extends { status: keyof typeof STATUS_CONFIGS }>(items: T[]): T[] => {
    return [...items].sort((a, b) => getStatusPriority(b.status) - getStatusPriority(a.status))
  }, [getStatusPriority])

  // Performance monitoring
  const metrics = useMemo(() => DesignSystemCache.getMetrics(), [config])

  return {
    // Configuration
    config,
    updateConfig,
    
    // Theme
    theme: config.theme,
    resolvedTheme,
    setTheme,
    isHydrated,
    
    // Display options
    animations: config.animations,
    setAnimations,
    density: config.density,
    setDensity,
    reducedMotion: config.reducedMotion,
    highContrast: config.highContrast,
    
    // Class generators
    classes,
    
    // Utilities
    getStatusConfig,
    getStatusPriority,
    sortByStatusPriority,
    
    // Constants
    STATUS_CONFIGS,
    DENSITY_CONFIGS,
    ANIMATION_CONFIGS,
    
    // Performance
    metrics,
    clearCache: DesignSystemCache.clear
  }
}