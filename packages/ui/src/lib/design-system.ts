// packages/ui/src/lib/design-system.ts
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ===== UTILITAIRES DE BASE =====

/**
 * Fonction utilitaire principale pour combiner les classes CSS
 * @description Combine clsx et tailwind-merge pour une gestion optimale des classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ===== THÈME GLOBAL =====

/**
 * Tokens de design centralisés
 * @description Source unique de vérité pour toutes les valeurs de design
 */
export const designTokens = {
  // Espacements standardisés
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Rayons de bordure
  radius: {
    none: '0',
    xs: '0.125rem',  // 2px
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },
  
  // Ombres standardisées
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Durées d'animation
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  // Z-index standardisés
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  }
} as const

// ===== VARIANTES DE COMPOSANTS =====

/**
 * Variantes pour les boutons
 * @description Système complet de variants pour tous les boutons
 */
const buttonVariants = cva(
  // Styles de base communs à tous les boutons
  [
    'inline-flex items-center justify-center',
    'rounded-md font-medium transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap text-sm ring-offset-background',
  ],
  {
    variants: {
      variant: {
        // Variante primaire (action principale)
        default: [
          'bg-primary text-primary-foreground shadow',
          'hover:bg-primary/90 focus-visible:ring-primary',
        ],
        // Variante destructive (actions critiques)
        destructive: [
          'bg-destructive text-destructive-foreground shadow-sm',
          'hover:bg-destructive/90 focus-visible:ring-destructive',
        ],
        // Variante outline (action secondaire)
        outline: [
          'border border-input bg-background shadow-sm',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-ring',
        ],
        // Variante secondaire
        secondary: [
          'bg-secondary text-secondary-foreground shadow-sm',
          'hover:bg-secondary/80 focus-visible:ring-secondary',
        ],
        // Variante fantôme (action tertiaire)
        ghost: [
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:ring-accent',
        ],
        // Variante lien
        link: [
          'text-primary underline-offset-4',
          'hover:underline focus-visible:ring-primary',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4',
        lg: 'h-10 px-6',
        xl: 'h-12 px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-10 w-10',
      },
      loading: {
        true: 'cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  }
)

/**
 * Variantes pour les badges/étiquettes
 * @description Système de badges métier pour les statuts
 */
const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full border px-2.5 py-0.5',
    'text-xs font-semibold transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground',
        
        // Variantes métier spécifiques
        success: 'border-transparent bg-green-500 text-white shadow',
        warning: 'border-transparent bg-amber-500 text-white shadow',
        info: 'border-transparent bg-blue-500 text-white shadow',
        
        // Statuts de projet
        'en-cours': 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'termine': 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'en-attente': 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
        'annule': 'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        'planifie': 'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        
        // Priorités
        'priorite-basse': 'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        'priorite-normale': 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'priorite-haute': 'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        'priorite-urgente': 'border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

/**
 * Variantes pour les cartes
 * @description Système de cartes réutilisables
 */
const cardVariants = cva(
  [
    'rounded-lg border bg-card text-card-foreground',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md',
        flat: 'shadow-none border-2',
        interactive: 'shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.02]',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

/**
 * Variantes pour les champs de formulaire
 * @description Système unifié pour tous les inputs
 */
const inputVariants = cva(
  [
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1',
    'text-sm shadow-sm transition-colors file:border-0 file:bg-transparent',
    'file:text-sm file:font-medium placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-9 px-3',
        lg: 'h-11 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// ===== ANIMATIONS STANDARDISÉES =====

/**
 * Classes d'animation réutilisables
 * @description Animations cohérentes dans toute l'application
 */
export const animations = {
  // Animations d'entrée
  fadeIn: 'animate-in fade-in-0 duration-200',
  slideInFromTop: 'animate-in slide-in-from-top-2 duration-200',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2 duration-200',
  slideInFromLeft: 'animate-in slide-in-from-left-2 duration-200',
  slideInFromRight: 'animate-in slide-in-from-right-2 duration-200',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  
  // Animations de sortie
  fadeOut: 'animate-out fade-out-0 duration-150',
  slideOutToTop: 'animate-out slide-out-to-top-2 duration-150',
  slideOutToBottom: 'animate-out slide-out-to-bottom-2 duration-150',
  slideOutToLeft: 'animate-out slide-out-to-left-2 duration-150',
  slideOutToRight: 'animate-out slide-out-to-right-2 duration-150',
  scaleOut: 'animate-out zoom-out-95 duration-150',
  
  // Animations de boucle
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  
  // Micro-interactions
  hover: 'transition-all duration-200 ease-in-out',
  press: 'transition-all duration-75 active:scale-95',
} as const

// ===== LAYOUTS RESPONSIFS =====

/**
 * Classes de layout réutilisables
 * @description Patterns de layout couramment utilisés
 */
export const layouts = {
  // Conteneurs
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  containerFluid: 'w-full px-4 sm:px-6 lg:px-8',
  
  // Stacks verticaux
  stack: 'flex flex-col',
  stackTight: 'flex flex-col space-y-2',
  stackNormal: 'flex flex-col space-y-4',
  stackLoose: 'flex flex-col space-y-6',
  stackXl: 'flex flex-col space-y-8',
  
  // Stacks horizontaux
  inline: 'flex items-center',
  inlineTight: 'flex items-center space-x-1',
  inlineNormal: 'flex items-center space-x-2',
  inlineLoose: 'flex items-center space-x-4',
  inlineXl: 'flex items-center space-x-6',
  
  // Alignements
  center: 'flex items-center justify-center',
  between: 'flex items-center justify-between',
  around: 'flex items-center justify-around',
  evenly: 'flex items-center justify-evenly',
  
  // Grilles
  grid: 'grid gap-4',
  gridTight: 'grid gap-2',
  gridLoose: 'grid gap-6',
  gridCols1: 'grid-cols-1',
  gridCols2: 'grid-cols-1 md:grid-cols-2',
  gridCols3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  gridCols4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  gridAuto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
} as const

// ===== HELPERS MÉTIER =====

/**
 * Génère les classes pour les statuts de projet
 * @description Mapping automatique statut → classes CSS
 */
export function getProjectStatusClasses(status: string): string {
  const statusMap: Record<string, string> = {
    'brouillon': cn(badgeVariants({ variant: 'secondary' })),
    'devis': cn(badgeVariants({ variant: 'info' })),
    'en-attente': cn(badgeVariants({ variant: 'en-attente' })),
    'accepte': cn(badgeVariants({ variant: 'success' })),
    'en-cours': cn(badgeVariants({ variant: 'en-cours' })),
    'en-pause': cn(badgeVariants({ variant: 'warning' })),
    'termine': cn(badgeVariants({ variant: 'termine' })),
    'annule': cn(badgeVariants({ variant: 'annule' })),
    'facture': cn(badgeVariants({ variant: 'success' })),
  }
  
  return statusMap[status.toLowerCase()] || cn(badgeVariants({ variant: 'secondary' }))
}

/**
 * Génère les classes pour les priorités
 * @description Mapping automatique priorité → classes CSS
 */
export function getPriorityClasses(priority: string): string {
  const priorityMap: Record<string, string> = {
    'basse': cn(badgeVariants({ variant: 'priorite-basse' })),
    'normale': cn(badgeVariants({ variant: 'priorite-normale' })),
    'haute': cn(badgeVariants({ variant: 'priorite-haute' })),
    'urgente': cn(badgeVariants({ variant: 'priorite-urgente' })),
  }
  
  return priorityMap[priority.toLowerCase()] || cn(badgeVariants({ variant: 'priorite-normale' }))
}

/**
 * Génère des couleurs pour les graphiques de manière cohérente
 * @description Palette de couleurs pour data visualization
 */
export function getChartColors(index: number): string {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',  
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]
  
  return colors[index % colors.length]
}

/**
 * Calcule la classe de couleur basée sur un pourcentage
 * @description Pour les barres de progression, jauges, etc.
 */
export function getProgressColor(percentage: number): string {
  if (percentage < 25) return 'bg-red-500'
  if (percentage < 50) return 'bg-orange-500'
  if (percentage < 75) return 'bg-yellow-500'
  if (percentage < 90) return 'bg-blue-500'
  return 'bg-green-500'
}

// ===== TYPES EXPORTÉS =====

export type ButtonVariants = VariantProps<typeof buttonVariants>
export type BadgeVariants = VariantProps<typeof badgeVariants>  
export type CardVariants = VariantProps<typeof cardVariants>
export type InputVariants = VariantProps<typeof inputVariants>

// ===== EXPORT DES CONSTANTES =====

export {
  badgeVariants, buttonVariants, cardVariants,
  inputVariants
}

// ===== VALIDATION DES VARIANTES =====

/**
 * Valide qu'une variante de badge existe
 */
export function isValidBadgeVariant(variant: string): boolean {
  const validVariants = [
    'default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info',
    'en-cours', 'termine', 'en-attente', 'annule', 'planifie',
    'priorite-basse', 'priorite-normale', 'priorite-haute', 'priorite-urgente'
  ]
  
  return validVariants.includes(variant)
}

/**
 * Obtient toutes les variantes disponibles pour un composant
 */
export function getAvailableVariants<T extends Record<string, any>>(
  variantConfig: T
): T extends { variants: infer V } ? keyof V : never {
  // Type helper pour obtenir les clés des variantes
  return Object.keys(variantConfig.variants || {}) as any
}