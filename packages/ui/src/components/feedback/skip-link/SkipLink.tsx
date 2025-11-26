'use client'

import { cn } from '../../../lib/utils'

export interface SkipLinkProps {
  /** ID de l'element cible (sans le #) */
  targetId?: string
  /** Texte du lien */
  label?: string
  /** Classes CSS additionnelles */
  className?: string
}

/**
 * Composant SkipLink pour la navigation au clavier
 * Permet aux utilisateurs de clavier de sauter directement au contenu principal
 *
 * Usage: Placer en premier element dans le layout
 * L'element cible doit avoir l'ID correspondant et tabindex="-1"
 */
export function SkipLink({
  targetId = 'main-content',
  label = 'Aller au contenu principal',
  className,
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={cn(
        // Invisible par defaut
        'sr-only',
        // Visible au focus
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
        'focus:px-4 focus:py-2',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all',
        className
      )}
    >
      {label}
    </a>
  )
}

/**
 * Groupe de SkipLinks pour plusieurs cibles
 */
export function SkipLinks({
  links,
  className,
}: {
  links: Array<{ targetId: string; label: string }>
  className?: string
}) {
  return (
    <nav
      aria-label="Liens de navigation rapide"
      className={cn('skip-links', className)}
    >
      {links.map((link) => (
        <SkipLink
          key={link.targetId}
          targetId={link.targetId}
          label={link.label}
        />
      ))}
    </nav>
  )
}

export default SkipLink
