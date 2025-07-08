// packages/ui/src/components/projet-card.tsx
import * as React from 'react'
import { cn } from '../lib/utils'

interface ProjetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const ProjetCard = React.forwardRef<HTMLDivElement, ProjetCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border bg-card text-card-foreground shadow-sm p-4', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ProjetCard.displayName = 'ProjetCard'

export { ProjetCard }
