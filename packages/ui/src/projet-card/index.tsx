"use client"

import * as React from "react"
import { cn } from "../lib/utils"

export interface ProjetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  projet?: {
    nom?: string
    description?: string
    client?: {
      nom?: string
    }
    statut?: string
  }
}

export const ProjetCard = React.forwardRef<HTMLDivElement, ProjetCardProps>(
  ({ className, projet, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow",
          className
        )}
        {...props}
      >
        {projet && (
          <>
            <h3 className="font-semibold">{projet.nom || 'Projet'}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {projet.description || ''}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{projet.client?.nom || ''}</span>
              <span>{projet.statut || ''}</span>
            </div>
          </>
        )}
        {children}
      </div>
    )
  }
)
ProjetCard.displayName = "ProjetCard"
