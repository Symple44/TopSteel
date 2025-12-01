/**
 * StatusBadge Variants - TopSteel Design System
 * Variants pour les badges de statut métier
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const statusBadgeVariants = cva(
  [
    'inline-flex items-center justify-center rounded-full font-medium',
    'transition-colors duration-200',
  ],
  {
    variants: {
      size: {
        xs: 'px-1.5 py-0.5 text-[10px]',
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
      variant: {
        solid: '', // Couleur pleine - défini dynamiquement
        outline: 'border-2 bg-transparent',
        subtle: '', // Fond léger - défini dynamiquement
        dot: 'gap-1.5', // Avec point coloré
      },
    },
    defaultVariants: {
      size: 'sm',
      variant: 'solid',
    },
  }
)

export type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>

// Mapping des statuts qui nécessitent du texte foncé (fond clair/jaune)
const DARK_TEXT_STATUSES = ['en-attente', 'stock-faible']

// Helper pour générer les classes de couleur selon le status
export function getStatusColorClasses(
  status: string,
  variant: 'solid' | 'outline' | 'subtle' | 'dot' = 'solid'
): string {
  const statusKey = status.toLowerCase().replace(/_/g, '-')
  const needsDarkText = DARK_TEXT_STATUSES.includes(statusKey)

  switch (variant) {
    case 'solid':
      // Utiliser text-foreground pour les fonds clairs, text-white pour les fonds foncés
      return `bg-status-${statusKey} ${needsDarkText ? 'text-foreground' : 'text-white'}`
    case 'outline':
      return `border-status-${statusKey} text-status-${statusKey}`
    case 'subtle':
      return `bg-status-${statusKey}/10 text-status-${statusKey}`
    case 'dot':
      return `text-foreground`
    default:
      return ''
  }
}

// Composant dot pour variant 'dot'
export const statusDotVariants = cva(
  'rounded-full',
  {
    variants: {
      size: {
        xs: 'h-1.5 w-1.5',
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
)
