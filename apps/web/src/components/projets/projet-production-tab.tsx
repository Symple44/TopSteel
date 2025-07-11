import { Button } from '@erp/ui'
'use client'

import { formatDate } from '@/lib/utils'
import type { Projet } from '@erp/types'
import { PrioriteProduction, StatutProduction } from '@erp/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from '@erp/ui'

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Factory,
  Pause,
  Play,
  Plus,
  User,
} from 'lucide-react'
import { useState } from 'react'

interface ProjetProductionTabProps {
  projet: Projet
}

// Interface pour les ordres de fabrication mock
interface MockOrdreFabrication {
  id: string
  numero: string
  dateDebut: Date
  dateFin?: Date
  progression: number
  statut: StatutProduction
  priorite: PrioriteProduction
  operations: any[]
}

// Données mockées pour la démonstration - CORRIGÉES
const mockOrdresFabrication: MockOrdreFabrication[] = [
  {
    id: '1',
    numero: 'OF-2025-0089',
    dateDebut: new Date('2025-06-20'),
    dateFin: new Date('2025-06-22'),
    progression: 100,
    statut: StatutProduction.TERMINE,
    priorite: PrioriteProduction.NORMALE,
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
    statut: StatutProduction.EN_COURS,
    priorite: PrioriteProduction.HAUTE,
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
    statut: StatutProduction.PLANIFIE,
    priorite: PrioriteProduction.BASSE,
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
        icon: Calendar,
      },
      [StatutProduction.EN_COURS]: {
        label: 'En cours',
        variant: 'default' as const,
        icon: Play,
      },
      [StatutProduction.PAUSE]: {
        label: 'En pause',
        variant: 'secondary' as const,
        icon: Pause,
      },
      [StatutProduction.TERMINE]: {
        label: 'Terminé',
        variant: 'secondary' as const,
        icon: CheckCircle2,
      },
      [StatutProduction.ANNULE]: {
        label: 'Annulé',
        variant: 'destructive' as const,
        icon: AlertCircle,
      },
      [StatutProduction.EN_ATTENTE]: {
        label: 'En attente',
        variant: 'outline' as const,
        icon: Clock,
      },
    }

    const config = statusConfig[statut]

    if (!config) return null

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
      [PrioriteProduction.BASSE]: {
        label: 'Basse',
        variant: 'outline' as const,
      },
      [PrioriteProduction.NORMALE]: {
        label: 'Normale',
        variant: 'secondary' as const,
      },
      [PrioriteProduction.HAUTE]: {
        label: 'Haute',
        variant: 'default' as const,
      },
      [PrioriteProduction.URGENTE]: {
        label: 'Urgente',
        variant: 'destructive' as const,
      },
    }

    const config = prioriteConfig[priorite]

    if (!config) return null

    return <Badge variant={config.variant}>{config.label}</Badge>
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
              {mockOrdresFabrication.filter((of) => of.statut === StatutProduction.EN_COURS).length}
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
              )}
              %
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
            <p className="text-xs text-muted-foreground">Pour tous les ordres</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Techniciens actifs</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Sur ce projet</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des ordres de fabrication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ordres de fabrication</CardTitle>
              <CardDescription>Suivi de la production et des opérations</CardDescription>
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
                <CardDescription>Détail des opérations de production</CardDescription>
              </div>
              {getStatutBadge(selectedOF.statut)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedOF.operations.map((operation) => (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getOperationStatusIcon(operation.statut)}
                    <div>
                      <h5 className="font-medium">{operation.nom}</h5>
                      <p className="text-sm text-muted-foreground">{operation.description}</p>
                      {operation.technicien && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Technicien: {operation.technicien.nom}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {operation.dureeReelle || operation.dureeEstimee}min
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {operation.dureeReelle ? 'Réalisé' : 'Estimé'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
