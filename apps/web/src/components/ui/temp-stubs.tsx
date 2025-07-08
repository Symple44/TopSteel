// Fichier temporaire pour corriger les erreurs de className
// À supprimer une fois que tous les composants sont bien définis

export interface ComponentWithClassName {
  children?: React.ReactNode
  className?: string
  asChild?: boolean
  side?: string
}

// Utilisé dans sidebar.tsx
export function TooltipTrigger({ children, className, asChild }: ComponentWithClassName) {
  return <div className={className}>{children}</div>
}

export function TooltipContent({ children, className, side }: ComponentWithClassName) {
  return <div className={className}>{children}</div>
}




