// packages/ui/src/components/projet-card/projet-card.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../base/card'
import { Badge } from '../base/badge'
import { Progress } from '../base/progress'
import { formatCurrency, formatDate } from '@erp/utils'
import type { Projet } from '@erp/types'

interface ProjetCardProps {
  projet: Projet
  onClick?: () => void
  className?: string
}

export function ProjetCard({ projet, onClick, className }: ProjetCardProps) {
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'EN_COURS': return 'bg-blue-100 text-blue-800'
      case 'TERMINE': return 'bg-green-100 text-green-800'
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800'
      case 'ANNULE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${className}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {projet.reference}
          </CardTitle>
          <Badge className={getStatusColor(projet.statut)}>
            {projet.statut}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {projet.client.nom}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Montant HT</span>
          <span className="font-semibold text-lg">
            {formatCurrency(projet.montantHT)}
          </span>
        </div>
        
        {projet.dateDebut && (
          <div className="flex justify-between items-center text-sm">
            <span>Début</span>
            <span>{formatDate(projet.dateDebut)}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Avancement</span>
            <span className="text-sm font-medium">{projet.avancement}%</span>
          </div>
          <Progress value={projet.avancement} className="h-2" />
        </div>
        
        {projet.alertes && projet.alertes.length > 0 && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">{projet.alertes.length} alerte(s)</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}