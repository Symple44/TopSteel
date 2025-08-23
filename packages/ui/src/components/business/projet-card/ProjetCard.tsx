import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Badge } from '../../data-display/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../layout/card'
export interface ProjetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  project?: {
    nom?: string
    description?: string
    client?: string
    statut?: string
    montant?: number
    dateDebut?: string
    dateFin?: string
    avancement?: number
  }
  onView?: () => void
  onEdit?: () => void
}
const ProjetCard = React.forwardRef<HTMLDivElement, ProjetCardProps>(
  ({ project, onView, onEdit, className, ...props }, ref) => {
    const getStatusVariant = (statut?: string) => {
      switch (statut?.toLowerCase()) {
        case 'en cours':
        case 'actif':
          return 'default'
        case 'terminé':
        case 'livré':
          return 'secondary'
        case 'en retard':
        case 'bloqué':
          return 'destructive'
        case 'en attente':
        case 'planifié':
          return 'outline'
        default:
          return 'outline'
      }
    }
    return (
      <Card
        ref={ref}
        className={cn(
          'cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]',
          className
        )}
        onClick={onView}
        {...props}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="line-clamp-1">{project?.nom || 'Projet sans nom'}</CardTitle>
              {project?.description && (
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              )}
            </div>
            {project?.statut && (
              <Badge variant={getStatusVariant(project.statut)}>{project.statut}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {project?.client && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Client: </span>
              <span>{project.client}</span>
            </div>
          )}
          {project?.montant && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Montant: </span>
              <span className="font-semibold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(project.montant)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {project?.dateDebut && (
              <span>Début: {new Date(project.dateDebut).toLocaleDateString('fr-FR')}</span>
            )}
            {project?.avancement !== undefined && <span>{project.avancement}% complété</span>}
          </div>
        </CardContent>
      </Card>
    )
  }
)
ProjetCard.displayName = 'ProjetCard'
export { ProjetCard }
