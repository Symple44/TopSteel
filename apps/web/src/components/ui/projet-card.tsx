'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Projet } from '@erp/types'
import { Calendar, Euro, Eye, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProjetCardProps {
  projet: Projet
}

export function ProjetCard({ projet }: ProjetCardProps) {
  const router = useRouter()

  const getStatusVariant = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'en_cours': return 'default'
      case 'termine': return 'default'
      case 'en_attente': return 'secondary'
      case 'annule': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {projet.nom || 'Projet sans nom'}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {projet.reference || 'Sans référence'}
            </p>
          </div>
          <Badge variant={getStatusVariant(projet.statut)}>
            {projet.statut || 'Non défini'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informations principales */}
        <div className="space-y-2 text-sm">
          {projet.client?.nom && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{projet.client.nom}</span>
            </div>
          )}
          
          {projet.dateDebut && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDate(projet.dateDebut)}</span>
            </div>
          )}
          
          {projet.montantHT && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-gray-400" />
              <span>{formatCurrency(projet.montantHT)}</span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        {typeof projet.avancement === 'number' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Avancement</span>
              <span>{projet.avancement}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, projet.avancement))}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => router.push(`/projets/${projet.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
