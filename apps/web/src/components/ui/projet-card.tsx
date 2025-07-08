'use client'

import { Badge } from "@erp/ui"
import { Button } from "@erp/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui"
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
      case 'en_cours':
        return 'default'
      case 'termine':
        return 'default'
      case 'en_attente':
        return 'secondary'
      case 'annule':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'en_cours':
        return 'En cours'
      case 'termine':
        return 'Terminé'
      case 'en_attente':
        return 'En attente'
      case 'brouillon':
        return 'Brouillon'
      case 'accepte':
        return 'Accepté'
      case 'annule':
        return 'Annulé'
      default:
        return statut || 'Non défini'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {projet.reference || 'Projet sans référence'}
            </CardTitle>
            {projet.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{projet.description}</p>
            )}
          </div>
          <Badge variant={getStatusVariant(projet.statut)}>{getStatusLabel(projet.statut)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations principales */}
        <div className="space-y-2 text-sm">
          {projet.client?.nom && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{projet.client.nom}</span>
            </div>
          )}

          {projet.dateDebut && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(projet.dateDebut)}</span>
              {projet.dateFin && (
                <span className="text-muted-foreground">- {formatDate(projet.dateFin)}</span>
              )}
            </div>
          )}

          {projet.montantHT && (
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatCurrency(projet.montantHT)}</span>
              <span className="text-xs text-muted-foreground">HT</span>
            </div>
          )}

          {/* Type de projet */}
          {projet.type && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                {projet.type}
              </span>
            </div>
          )}

          {/* Priorité */}
          {projet.priorite && (
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  projet.priorite === 'URGENTE'
                    ? 'bg-destructive text-destructive-foreground'
                    : projet.priorite === 'HAUTE'
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {projet.priorite}
              </span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        {typeof projet.avancement === 'number' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avancement</span>
              <span className="font-medium">{projet.avancement}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
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
            <Eye className="h-4 w-4 mr-2" />
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}




