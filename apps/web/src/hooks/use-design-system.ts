import { CSSUtils, designTokens, useStylesStore } from '@/lib/styles'
import { useMemo } from 'react'

/**
 * Hook pratique pour utiliser le design system
 */
export function useDesignSystem() {
  const { theme, resolvedTheme, density, animations } = useStylesStore()
  
  const classes = useMemo(() => ({
    // Classes utilitaires
    projectCard: CSSUtils.cn(
      'bg-card border-border rounded-lg shadow-sm',
      'p-density-md gap-density-sm',
      animations && 'transition-all duration-200 hover:shadow-cardInteractive'
    ),
    
    statusBadge: (status: string) => CSSUtils.cn(
      'px-2 py-1 rounded-full text-xs font-medium',
      {
        'EN_COURS': 'bg-status-active text-white',
        'TERMINE': 'bg-status-completed text-white', 
        'ANNULE': 'bg-status-cancelled text-white',
        'DRAFT': 'bg-status-draft text-status-draft-foreground'
      }[status] || 'bg-muted text-muted-foreground'
    ),
    
    metallurgyButton: CSSUtils.cn(
      'bg-metallurgy-500 text-white hover:bg-metallurgy-600',
      'px-4 py-2 rounded-lg font-medium',
      animations && 'transition-colors duration-200'
    )
  }), [animations])
  
  const colors = useMemo(() => ({
    primary: designTokens.colors.primary,
    metallurgy: designTokens.colors.metallurgy,
    steel: designTokens.colors.steel,
    status: designTokens.colors.status,
    priority: designTokens.colors.priority
  }), [])
  
  return {
    theme,
    resolvedTheme,
    density,
    animations,
    classes,
    colors,
    tokens: designTokens,
    utils: CSSUtils
  }
}