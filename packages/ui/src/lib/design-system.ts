// ===== DESIGN SYSTEM ERP TOPSTEEL =====
// packages/ui/src/lib/design-system.ts
// Système de design cohérent avec variants métier

import { cn } from "./utils"

// ===== VARIANTS DE COMPOSANTS =====

/**
 * Variants pour les boutons avec cohérence visuelle
 */
export const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary",
    ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent",
    link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary",
    success: "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning",
    metallurgy: "bg-metallurgy-600 text-white hover:bg-metallurgy-700 focus-visible:ring-metallurgy-500",
  },
  size: {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 rounded-md px-3 text-sm",
    lg: "h-11 rounded-md px-8 text-base",
    icon: "h-10 w-10 rounded-md",
    xs: "h-8 px-2 text-xs",
  }
}

/**
 * Variants pour les badges avec statuts métier
 */
export const badgeVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground border border-input",
    success: "bg-success text-success-foreground hover:bg-success/80",
    warning: "bg-warning text-warning-foreground hover:bg-warning/80",
    // Statuts métier ERP
    "en-cours": "bg-info text-info-foreground",
    "termine": "bg-success text-success-foreground",
    "en-retard": "bg-destructive text-destructive-foreground",
    "planifie": "bg-secondary text-secondary-foreground",
    "urgent": "bg-priority-high text-priority-high-foreground animate-pulse",
    // Statuts financiers
    "paye": "bg-success text-success-foreground",
    "impaye": "bg-destructive text-destructive-foreground",
    "en-attente": "bg-warning text-warning-foreground",
  }
}

/**
 * Variants pour les cartes avec types métier
 */
export const cardVariants = {
  variant: {
    default: "bg-card text-card-foreground border border-border",
    elevated: "bg-card text-card-foreground border border-border shadow-md",
    ghost: "bg-transparent",
    // Types métier
    project: "bg-card text-card-foreground border-l-4 border-l-metallurgy-500",
    invoice: "bg-card text-card-foreground border-l-4 border-l-success",
    quote: "bg-card text-card-foreground border-l-4 border-l-info",
    client: "bg-card text-card-foreground border-l-4 border-l-secondary",
  },
  padding: {
    none: "p-0",
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  }
}

/**
 * Variants pour les inputs avec validation
 */
export const inputVariants = {
  variant: {
    default: "border-input bg-background focus-visible:ring-ring",
    error: "border-destructive bg-background focus-visible:ring-destructive",
    success: "border-success bg-background focus-visible:ring-success",
    warning: "border-warning bg-background focus-visible:ring-warning",
  },
  size: {
    sm: "h-8 px-2 text-sm",
    default: "h-10 px-3",
    lg: "h-12 px-4 text-base",
  }
}

// ===== CLASSES DE BASE COMMUNES =====

/**
 * Classes communes pour les composants interactifs
 */
export const interactiveClasses = {
  focus: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  disabled: "disabled:pointer-events-none disabled:opacity-50",
  transition: "transition-colors duration-200",
  hover: "hover:bg-accent hover:text-accent-foreground",
}

/**
 * Classes pour les animations
 */
export const animationClasses = {
  fadeIn: "animate-in fade-in-0 duration-200",
  fadeOut: "animate-out fade-out-0 duration-150",
  slideIn: "animate-in slide-in-from-top-2 duration-200",
  slideOut: "animate-out slide-out-to-top-2 duration-150",
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-150",
  pulse: "animate-pulse",
  spin: "animate-spin",
}

/**
 * Classes pour les layouts responsifs
 */
export const layoutClasses = {
  container: "container mx-auto px-4 sm:px-6 lg:px-8",
  stack: "flex flex-col space-y-4",
  stackSm: "flex flex-col space-y-2",
  stackLg: "flex flex-col space-y-6",
  inline: "flex items-center space-x-2",
  inlineSm: "flex items-center space-x-1",
  inlineLg: "flex items-center space-x-4",
  center: "flex items-center justify-center",
  between: "flex items-center justify-between",
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  gridTight: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2",
  gridWide: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
}

// ===== UTILITAIRES MÉTIER =====

/**
 * Génère les classes pour les statuts de projet
 */
export const getProjectStatusClasses = (status: string): string => {
  const statusMap: Record<string, string> = {
    'planifie': cn(badgeVariants.variant.planifie, "rounded-full px-3 py-1"),
    'en-cours': cn(badgeVariants.variant["en-cours"], "rounded-full px-3 py-1"),
    'termine': cn(badgeVariants.variant.termine, "rounded-full px-3 py-1"),
    'en-retard': cn(badgeVariants.variant["en-retard"], "rounded-full px-3 py-1"),
    'annule': cn(badgeVariants.variant.destructive, "rounded-full px-3 py-1"),
  }
  
  return statusMap[status] || cn(badgeVariants.variant.secondary, "rounded-full px-3 py-1")
}

/**
 * Génère les classes pour les priorités
 */
export const getPriorityClasses = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'low': "bg-priority-low text-priority-low-foreground",
    'medium': "bg-priority-medium text-priority-medium-foreground",
    'high': "bg-priority-high text-priority-high-foreground",
    'critical': "bg-priority-critical text-priority-critical-foreground animate-pulse",
  }
  
  return cn(
    priorityMap[priority] || priorityMap.medium,
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
  )
}

/**
 * Génère les classes pour les montants financiers
 */
export const getAmountClasses = (amount: number, context: 'positive' | 'negative' | 'neutral' = 'neutral'): string => {
  const baseClasses = "font-mono text-right"
  
  if (context === 'positive' || amount > 0) {
    return cn(baseClasses, "text-success")
  }
  
  if (context === 'negative' || amount < 0) {
    return cn(baseClasses, "text-destructive")
  }
  
  return cn(baseClasses, "text-foreground")
}

// ===== CLASSES RESPONSIVES =====

/**
 * Classes responsives pour les tableaux
 */
export const tableResponsiveClasses = {
  container: "w-full overflow-auto",
  table: "w-full caption-bottom text-sm",
  header: "sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
  cell: "px-4 py-3 text-left [&:has([role=checkbox])]:pr-0",
  cellCompact: "px-2 py-2 text-sm [&:has([role=checkbox])]:pr-0",
  cellNumeric: "px-4 py-3 text-right font-mono",
}

/**
 * Classes pour les formulaires responsifs
 */
export const formResponsiveClasses = {
  container: "space-y-6",
  section: "space-y-4",
  fieldGroup: "grid grid-cols-1 md:grid-cols-2 gap-4",
  fieldGroupTight: "grid grid-cols-1 md:grid-cols-2 gap-2",
  fieldGroupWide: "grid grid-cols-1 md:grid-cols-3 gap-4",
  field: "space-y-2",
  label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  description: "text-sm text-muted-foreground",
  error: "text-sm font-medium text-destructive",
}

// ===== HELPERS AVANCÉS =====

/**
 * Classe utilitaire pour créer des variants avec class-variance-authority
 */
export const createVariants = <T extends Record<string, Record<string, string>>>(
  variants: T
) => variants

/**
 * Helper pour combiner des variants
 */
export const combineVariants = (
  baseClasses: string,
  variants: Record<string, string | undefined>,
  variantConfig: Record<string, Record<string, string>>
): string => {
  const variantClasses = Object.entries(variants)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => variantConfig[key]?.[value!])
    .filter(Boolean)

  return cn(baseClasses, ...variantClasses)
}

/**
 * Génère des classes pour les états de chargement
 */
export const getLoadingClasses = (variant: 'skeleton' | 'pulse' | 'spin' = 'skeleton'): string => {
  const loadingMap = {
    skeleton: "bg-muted animate-pulse rounded",
    pulse: "animate-pulse",
    spin: "animate-spin",
  }
  
  return loadingMap[variant]
}

/**
 * Génère des classes pour les alertes contextuelles
 */
export const getAlertClasses = (type: 'info' | 'success' | 'warning' | 'error'): string => {
  const alertMap = {
    info: "bg-info/10 text-info border-info/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
  }
  
  return cn(
    "border rounded-lg p-4",
    alertMap[type]
  )
}
