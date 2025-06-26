import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"

interface ProjetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  projet?: {
    id?: string
    nom?: string
    description?: string
    statut?: string
    client?: string
    progression?: number
    budget?: number
    dateEcheance?: Date | string
  }
  onClick?: () => void
}

const ProjetCard = React.forwardRef<HTMLDivElement, ProjetCardProps>(
  ({ className, projet, onClick, ...props }, ref) => {
    if (!projet) return null

    return (
      <Card
        ref={ref}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{projet.nom}</CardTitle>
              {projet.client && (
                <CardDescription>{projet.client}</CardDescription>
              )}
            </div>
            {projet.statut && (
              <Badge variant={projet.statut === 'termine' ? 'success' : 'default'}>
                {projet.statut}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {projet.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {projet.description}
            </p>
          )}
          {projet.progression !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{projet.progression}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${projet.progression}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
ProjetCard.displayName = "ProjetCard"

export { ProjetCard }
