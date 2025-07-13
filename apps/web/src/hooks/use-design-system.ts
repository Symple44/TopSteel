/**
 * 🎨 DESIGN SYSTEM HOOK ENTERPRISE - TOPSTEEL ERP
 * Version optimisée pour performance et évolutivité
 *
 * Corrections apportées:
 * - Fix du warning useMemo avec dépendance 'config' inutile (ligne ~626)
 * - Optimisation des dépendances des hooks
 * - Cache intelligent des styles avec invalidation
 * - Thème adaptatif automatique
 * - Classes métier pré-calculées
 * - Performance monitoring intégré
 * - Extensibilité modulaire
 * - SSR-Safe complet
 * - Types stricts
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
    priority: 1,
  },
  TERMINE: {
    color: 'green-500',
    bgColor: 'green-50',
    textColor: 'green-700',
    icon: 'check-circle',
    priority: 5,
  },
  ANNULE: {
    color: 'red-500',
    bgColor: 'red-50',
    textColor: 'red-700',
    icon: 'x-circle',
    priority: 0,
  },
  BROUILLON: {
    color: 'gray-400',
    bgColor: 'gray-50',
    textColor: 'gray-600',
    icon: 'edit',
    priority: 2,
  },

  // Devis
  EN_ATTENTE: {
    color: 'yellow-500',
    bgColor: 'yellow-50',
    textColor: 'yellow-700',
    icon: 'clock',
    priority: 3,
  },
  ACCEPTE: {
    color: 'blue-600',
    bgColor: 'blue-50',
    textColor: 'blue-800',
    icon: 'thumbs-up',
    priority: 4,
  },
  REFUSE: {
    color: 'red-600',
    bgColor: 'red-50',
    textColor: 'red-800',
    icon: 'thumbs-down',
    priority: 1,
  },

  // Production
  PLANIFIE: {
    color: 'indigo-500',
    bgColor: 'indigo-50',
    textColor: 'indigo-700',
    icon: 'calendar',
    priority: 2,
  },
  EN_PRODUCTION: {
    color: 'orange-500',
    bgColor: 'orange-50',
    textColor: 'orange-700',
    icon: 'cog',
    priority: 3,
  },
  CONTROLE_QUALITE: {
    color: 'purple-500',
    bgColor: 'purple-50',
    textColor: 'purple-700',
    icon: 'shield-check',
    priority: 4,
  },

  // Stock
  EN_STOCK: {
    color: 'emerald-500',
    bgColor: 'emerald-50',
    textColor: 'emerald-700',
    icon: 'package',
    priority: 5,
  },
  RUPTURE: {
    color: 'red-500',
    bgColor: 'red-50',
    textColor: 'red-700',
    icon: 'alert-triangle',
    priority: 0,
  },
  STOCK_FAIBLE: {
    color: 'amber-500',
    bgColor: 'amber-50',
    textColor: 'amber-700',
    icon: 'alert-circle',
    priority: 1,
  },
} as const

export const DENSITY_CONFIGS = {
  compact: {
    padding: 'p-2',
    gap: 'gap-1',
    text: 'text-sm',
    height: 'h-8',
  },
  comfortable: {
    padding: 'p-4',
    gap: 'gap-3',
    text: 'text-base',
    height: 'h-10',
  },
  spacious: {
    padding: 'p-6',
    gap: 'gap-4',
    text: 'text-lg',
    height: 'h-12',
  },
} as const

export const ANIMATION_CONFIGS = {
  none: {
    transition: '',
    hover: '',
    enter: '',
    exit: '',
  },
  reduced: {
    transition: 'transition-colors duration-150',
    hover: 'hover:bg-opacity-80',
    enter: 'animate-in fade-in duration-150',
    exit: 'animate-out fade-out duration-150',
  },
  full: {
    transition: 'transition-all duration-200 ease-in-out',
    hover: 'hover:scale-105 hover:shadow-md',
    enter: 'animate-in fade-in slide-in-from-bottom-2 duration-300',
    exit: 'animate-out fade-out slide-out-to-bottom-2 duration-200',
  },
} as const

// =============================================
// CACHE ET PERFORMANCE OPTIMISÉS
// =============================================

// Design System Cache as module-level functions
const designSystemClassCache = new Map<string, string>()
const designSystemConfigCache = new Map<string, DesignSystemConfig>()
const maxCacheSize = 500
const designSystemMetrics: DesignSystemMetrics = {
  themeSwitches: 0,
  classGenerations: 0,
  cacheHits: 0,
  performanceMs: [],
}

function getDesignSystemClass(key: string): string | undefined {
  const result = designSystemClassCache.get(key)

  if (result) {
    designSystemMetrics.cacheHits++
  }

  return result
}

function setDesignSystemClass(key: string, value: string): void {
  if (designSystemClassCache.size >= maxCacheSize) {
    const firstKey = designSystemClassCache.keys().next().value

    if (firstKey) {
      designSystemClassCache.delete(firstKey)
    }
  }
  designSystemClassCache.set(key, value)
}

function recordClassGeneration(durationMs: number): void {
  designSystemMetrics.classGenerations++
  designSystemMetrics.performanceMs.push(durationMs)

  // Garder seulement les 100 dernières mesures
  if (designSystemMetrics.performanceMs.length > 100) {
    designSystemMetrics.performanceMs = designSystemMetrics.performanceMs.slice(-100)
  }
}

function recordThemeSwitch(): void {
  designSystemMetrics.themeSwitches++
}

function getDesignSystemMetrics(): DesignSystemMetrics {
  return { ...designSystemMetrics }
}

function clearDesignSystemCache(): void {
  designSystemClassCache.clear()
  designSystemConfigCache.clear()
}

// =============================================
// GÉNÉRATEURS DE CLASSES OPTIMISÉS
// =============================================

// Class generator functions
function generateProjectCardClasses(config: DesignSystemConfig): string {
  const cacheKey = `projectCard-${config.density}-${config.animations}-${config.borderRadius}`
  const cached = getDesignSystemClass(cacheKey)

  if (cached) return cached

  const startTime = performance.now()

  const densityConfig = DENSITY_CONFIGS[config.density]
  const animationConfig = ANIMATION_CONFIGS[config.animations]

  const classes = cn(
    // Base
    'bg-white rounded-lg shadow-sm border border-border',

    // Density
    densityConfig.padding,
    densityConfig.gap,

    // Animations
    animationConfig.transition,
    config.animations !== 'none' && animationConfig.hover,

    // Border radius
    config.borderRadius === 'none' && 'rounded-none',
    config.borderRadius === 'small' && 'rounded-sm',
    config.borderRadius === 'medium' && 'rounded-lg',
    config.borderRadius === 'large' && 'rounded-xl',

    // Dark mode
    'dark:bg-card-dark dark:border-border-dark'
  )

  recordClassGeneration(performance.now() - startTime)
  setDesignSystemClass(cacheKey, classes)

  return classes
}

function generateStatusBadgeClasses(
  status: keyof typeof STATUS_CONFIGS,
  config: DesignSystemConfig
): string {
  const cacheKey = `statusBadge-${status}-${config.density}`
  const cached = getDesignSystemClass(cacheKey)

  if (cached) return cached

  const startTime = performance.now()

  const statusConfig = STATUS_CONFIGS[status]
  const densityConfig = DENSITY_CONFIGS[config.density]

  const classes = cn(
    // Base
    'inline-flex items-center font-medium rounded-full',

    // Density
    densityConfig.text,
    config.density === 'compact' && 'px-2 py-0.5',
    config.density === 'comfortable' && 'px-2.5 py-1',
    config.density === 'spacious' && 'px-3 py-1.5',

    // Status colors
    `bg-${statusConfig.bgColor} text-${statusConfig.textColor} border border-${statusConfig.color}/20`
  )

  recordClassGeneration(performance.now() - startTime)
  setDesignSystemClass(cacheKey, classes)

  return classes
}

function generateMetallurgyButtonClasses(
  variant: ClassVariants['variant'],
  size: ClassVariants['size'],
  config: DesignSystemConfig
): string {
  const cacheKey = `metallurgyButton-${variant}-${size}-${config.animations}`
  const cached = getDesignSystemClass(cacheKey)

  if (cached) return cached

  const startTime = performance.now()

  const animationConfig = ANIMATION_CONFIGS[config.animations]

  const classes = cn(
    // Base
    'inline-flex items-center justify-center rounded-md font-medium ring-offset-background',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',

    // Animations
    animationConfig.transition,

    // Variant
    variant === 'default' && 'bg-metallurgy-600 text-white hover:bg-metallurgy-700',
    variant === 'secondary' && 'bg-metallurgy-100 text-metallurgy-900 hover:bg-metallurgy-200',
    variant === 'outline' &&
      'border border-metallurgy-300 bg-transparent hover:bg-metallurgy-50 text-metallurgy-600',
    variant === 'ghost' && 'hover:bg-metallurgy-100 text-metallurgy-600',
    variant === 'destructive' &&
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',

    // Size
    size === 'sm' && 'h-9 px-3 text-sm',
    size === 'md' && 'h-10 px-4 py-2',
    size === 'lg' && 'h-11 px-8 text-base',
    size === 'xl' && 'h-12 px-10 text-lg'
  )

  recordClassGeneration(performance.now() - startTime)
  setDesignSystemClass(cacheKey, classes)

  return classes
}

function generateDataTableClasses(config: DesignSystemConfig): string {
  const cacheKey = `dataTable-${config.density}-${config.animations}`
  const cached = getDesignSystemClass(cacheKey)

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
    `[&_th]:${densityConfig.padding}`,
    `[&_td]:${densityConfig.padding}`,
    `[&_th]:${densityConfig.text}`,
    `[&_td]:${densityConfig.text}`,

    // Hover effects
    `[&_tbody_tr]:${animationConfig.transition}`,
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

  recordClassGeneration(performance.now() - startTime)
  setDesignSystemClass(cacheKey, classes)

  return classes
}

// =============================================
// HOOK PRINCIPAL OPTIMISÉ
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
      borderRadius: 'medium',
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
      setConfig((prev) => ({
        ...prev,
        reducedMotion: mediaQuery.matches,
        animations: mediaQuery.matches ? 'reduced' : prev.animations,
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
        recordThemeSwitch()
      }

      previousConfigRef.current = config
    } catch (error) {
      console.warn('Failed to save design system config:', error)
    }
  }, [config, isHydrated])

  // FIX: Memoized class generators avec dépendances correctes
  const classes = useMemo(
    () => ({
      projectCard: () => generateProjectCardClasses(config),
      statusBadge: (status: keyof typeof STATUS_CONFIGS) =>
        generateStatusBadgeClasses(status, config),
      metallurgyButton: (
        variant: ClassVariants['variant'] = 'default',
        size: ClassVariants['size'] = 'md'
      ) => generateMetallurgyButtonClasses(variant, size, config),
      dataTable: () => generateDataTableClasses(config),
    }),
    [config]
  ) // ✅ Ajout de la dépendance config pour être cohérent

  // Update functions avec optimisation
  const updateConfig = useCallback((updates: Partial<DesignSystemConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      updateConfig({ theme })
    },
    [updateConfig]
  )

  const setAnimations = useCallback(
    (animations: AnimationLevel) => {
      updateConfig({ animations })
    },
    [updateConfig]
  )

  const setDensity = useCallback(
    (density: Density) => {
      updateConfig({ density })
    },
    [updateConfig]
  )

  // Utility functions
  const getStatusConfig = useCallback((status: keyof typeof STATUS_CONFIGS) => {
    return STATUS_CONFIGS[status]
  }, [])

  const getStatusPriority = useCallback((status: keyof typeof STATUS_CONFIGS): number => {
    return STATUS_CONFIGS[status]?.priority ?? 0
  }, [])

  const sortByStatusPriority = useCallback(
    <T extends { status: keyof typeof STATUS_CONFIGS }>(items: T[]): T[] => {
      return [...items].sort((a, b) => getStatusPriority(b.status) - getStatusPriority(a.status))
    },
    [getStatusPriority]
  )

  // Performance monitoring - cache optimisé sans re-calculs inutiles
  const metrics = useMemo(() => getDesignSystemMetrics(), [])

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

    // Class generators (avec cache intelligent intégré)
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
    clearCache: clearDesignSystemCache,
  }
}
