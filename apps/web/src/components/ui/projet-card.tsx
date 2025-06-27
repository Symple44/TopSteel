// apps/web/src/components/ui/projet-card.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Projet } from '@erp/types'
import { Calendar, Euro, ExternalLink, User } from 'lucide-react'
import Link from 'next/link'

interface ProjetCardProps {
  projet: Projet
}

export function ProjetCard({ projet }: ProjetCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{projet.reference}</CardTitle>
            <CardDescription className="mt-1">
              {projet.description}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {projet.statut}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-2" />
          <span>{projet.client?.nom || 'Client non défini'}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {projet.dateDebut ? formatDate(projet.dateDebut) : 'Date non définie'}
            </span>
          </div>
          <div className="flex items-center font-medium">
            <Euro className="h-4 w-4 mr-1" />
            <span>{formatCurrency(projet.montantHT)}</span>
          </div>
        </div>
        
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Avancement</span>
            <span>{projet.avancement}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${projet.avancement}%` }}
            />
          </div>
        </div>

        {/* ✅ Bouton avec asChild pour la navigation */}
        <div className="pt-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/projets/${projet.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir les détails
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}