'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatDate, getInitials } from '@/lib/utils'
import { DEVIS_STATUT, PROJET_STATUT, STATUT_PRODUCTION } from '@erp/types/dist/constants'
import { AlertCircle, Calendar, CheckCircle2, Clock, Factory, Pause, Play, Plus, User, Wrench } from 'lucide-react'
import { useState } from 'react'
import { DEVIS_STATUT, PROJET_STATUT, STATUT_PRODUCTION } from '@erp/types/dist/constants'

interface ProjetProductionTabProps {
  projet: Projet
}

// Données mockées pour la démonstration
const mockOrdresFabrication = [
  {
    id: '1',
    numero: 'OF-2025-0089',
    dateDebut: new Date('2025-06-20'),
    dateFin: new Date('2025-06-22'),
    progression: 100,
    operations: [
      {
        id: '1',
        nom: 'Découpe laser',
        description: 'Découpe des tôles selon plans',
        dureeEstimee: 240,
        dureeReelle: 220,
        statut: 'TERMINEE',
        technicien: { nom: 'Pierre Durand', id: '1' },
        dateDebut: new Date('2025-06-20T08:00:00'),
        dateFin: new Date('2025-06-20T12:00:00'),
      },
      {
        id: '2',
        nom: 'Pliage',
        description: 'Pliage des éléments découpés',
        dureeEstimee: 180,
        dureeReelle: 180,
        statut: 'TERMINEE',
        technicien: { nom: 'Marc Leblanc', id: '2' },
        dateDebut: new Date('2025-06-20T13:00:00'),
        dateFin: new Date('2025-06-20T16:00:00'),
      },
    ],
  },
  {
    id: '2',
    numero: 'OF-2025-0090',
    dateDebut: new Date('2025-06-22'),
    progression: 45,
    operations: [
      {
        id: '3',
        nom: 'Soudure assemblage',
        description: 'Assemblage des éléments par soudure',
        dureeEstimee: 480,
        dureeReelle: 240,
        statut: 'EN_COURS',
        technicien: { nom: 'Jean Martin', id: '3' },
        dateDebut: new Date('2025-06-22T08:00:00'),
      },
      {
        id: '4',
        nom: 'Traitement de surface',
        description: 'Galvanisation à chaud',
        dureeEstimee: 120,
        statut: 'EN_ATTENTE',
      },
    ],
  },
  {
    id: '3',
    numero: 'OF-2025-0091',
    dateDebut: new Date('2025-06-25'),
    progression: 0,
    operations: [
      {
        id: '5',
        nom: 'Usinage',
        description: 'Perçage et taraudage',
        dureeEstimee: 180,
        statut: 'EN_ATTENTE',
      },
      {
        id: '6',
        nom: 'Contrôle qualité',
        description: 'Vérification dimensionnelle',
        dureeEstimee: 60,
        statut: 'EN_ATTENTE',
      },
    ],
  },
]

export function ProjetProductionTab({ projet }: ProjetProductionTabProps) {
  const [selectedOF, setSelectedOF] = useState(mockOrdresFabrication[0])

  const getStatutBadge = (statut: StatutProduction) => {
    const statusConfig = {
      [StatutProduction.PLANIFIE]: {
        label: 'Planifié',
        variant: 'outline' as const,
        icon: Calendar
      },
      [StatutProduction.EN_COURS]: {
        label: 'En cours',
        variant: 'default' as const,
        icon: Play
      },
      [StatutProduction.PAUSE]: {
        label: 'En pause',
        variant: 'secondary' as const,
        icon: Pause
      },
      [StatutProduction.TERMINE]: {
        label: 'Terminé',
        variant: 'secondary' as const,
        icon: CheckCircle2
      },
      [StatutProduction.ANNULE]: {
        label: 'Annulé',
        variant: 'destructive' as const,
        icon: AlertCircle
      },
    }
    
    const config = statusConfig[statut]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPrioriteBadge = (priorite: PrioriteProduction) => {
    const prioriteConfig = {
    }
    
    const config = prioriteConfig[priorite]
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const getOperationStatusIcon = (statut: string) => {
    switch (statut) {
      case 'TERMINEE':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'EN_COURS':
        return <Play className="h-4 w-4 text-blue-600" />
      case 'EN_ATTENTE':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'BLOQUEE':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble de la production */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordres en cours</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {mockOrdresFabrication.length} au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                mockOrdresFabrication.reduce((acc, of) => acc + of.progression, 0) / 
                mockOrdresFabrication.length
              )}%
            </div>
            <Progress 
              value={
                mockOrdresFabrication.reduce((acc, of) => acc + of.progression, 0) / 
                mockOrdresFabrication.length
              } 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps total estimé</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48h</div>
            <p className="text-xs text-muted-foreground">
              Pour tous les ordres
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Techniciens actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Sur ce projet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des ordres de fabrication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ordres de fabrication</CardTitle>
              <CardDescription>
                Suivi de la production et des opérations
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel ordre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockOrdresFabrication.map((of) => (
              <div
                key={of.id}
                className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedOF?.id === of.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedOF(of)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{of.numero}</h4>
                      {getStatutBadge(of.statut)}
                      {getPrioriteBadge(of.priorite)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Début: {formatDate(of.dateDebut)}
                      {of.dateFin && ` - Fin: ${formatDate(of.dateFin)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{of.progression}%</div>
                    <p className="text-xs text-muted-foreground">Progression</p>
                  </div>
                </div>
                <Progress value={of.progression} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Détail de l'ordre sélectionné */}
      {selectedOF && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedOF.numero}</CardTitle>
                <CardDescription>
                  Détail des opérations de production
                </CardDescription>
              </div>
              {getStatutBadge(selectedOF.statut)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedOF.operations.map((operation, index) => (
                <div key={operation.id} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {getOperationStatusIcon(operation.statut)}
                    </div>
                    {index < selectedOF.operations.length - 1 && (
                      <div className="absolute top-10 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{operation.nom}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {operation.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            <span>Durée: {operation.dureeEstimee} min</span>
                            {operation.dureeReelle && (
                              <span className="text-muted-foreground">
                                (réel: {operation.dureeReelle} min)
                              </span>
                            )}
                          </div>
                          {operation.dateDebut && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatDate(operation.dateDebut, 'time')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {operation.technicien && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/api/avatar/${operation.technicien.id}`} alt="Photo" />
                            <AvatarFallback>
                              {getInitials(operation.technicien.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{operation.technicien.nom}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

              <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                <Button variant="outline">
                  <Pause className="mr-2 h-4 w-4" />
                  Mettre en pause
                </Button>
                <Button>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Terminer l'ordre
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}









