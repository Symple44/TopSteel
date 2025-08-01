'use client'

import type { Operation } from '@erp/domains/production'
import {
  OperationStatut,
  PrioriteProduction,
  StatutProduction,
  TypeOperation,
} from '@erp/domains/production'
import type { StoreProjet } from '@erp/types'
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
  Settings,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'

interface ProjetProductionTabProps {
  projet: StoreProjet
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
  operations: Operation[]
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
        type: TypeOperation.DECOUPE,
        tempsEstime: 240,
        tempsReel: 220,
        statut: OperationStatut.TERMINEE,
        operateurIds: ['1'],
        ordreId: '1',
        ordre: 1,
        priorite: PrioriteProduction.NORMALE,
        schedule: {
          dateDebut: new Date('2025-06-20T08:00:00'),
          dateFin: new Date('2025-06-20T12:00:00'),
          dureeEstimee: 4,
        },
        prerequis: [],
        outillage: [],
        parametres: {},
        qualite: {
          normes: [],
          tolerances: {},
          controles: [],
          certificationsRequises: [],
        },
        avancement: 100,
        projetId: 'proj_001',
        createdBy: 'user_001',
        createdAt: new Date('2025-06-20T00:00:00'),
        updatedAt: new Date('2025-06-20T12:00:00'),
      },
      {
        id: '2',
        nom: 'Pliage',
        description: 'Pliage des éléments découpés',
        type: TypeOperation.PLIAGE,
        tempsEstime: 180,
        tempsReel: 180,
        statut: OperationStatut.TERMINEE,
        operateurIds: ['2'],
        ordreId: '1',
        ordre: 2,
        priorite: PrioriteProduction.NORMALE,
        schedule: {
          dateDebut: new Date('2025-06-20T13:00:00'),
          dateFin: new Date('2025-06-20T16:00:00'),
          dureeEstimee: 3,
        },
        prerequis: ['1'],
        outillage: [],
        parametres: {},
        qualite: {
          normes: [],
          tolerances: {},
          controles: [],
          certificationsRequises: [],
        },
        avancement: 100,
        projetId: 'proj_001',
        createdBy: 'user_001',
        createdAt: new Date('2025-06-20T00:00:00'),
        updatedAt: new Date('2025-06-20T16:00:00'),
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
        type: TypeOperation.SOUDURE,
        tempsEstime: 480,
        tempsReel: 240,
        statut: OperationStatut.EN_COURS,
        operateurIds: ['3'],
        ordreId: '2',
        ordre: 1,
        priorite: PrioriteProduction.HAUTE,
        schedule: {
          dateDebut: new Date('2025-06-22T08:00:00'),
          dateFin: new Date('2025-06-22T16:00:00'),
          dureeEstimee: 8,
        },
        prerequis: [],
        outillage: ['Poste à souder MIG'],
        parametres: { amperage: 180, vitesse: 5 },
        qualite: {
          normes: ['ISO 3834'],
          tolerances: { gap: 2 },
          controles: ['Visuel', 'Ressuage'],
          certificationsRequises: ['EN 1090'],
        },
        avancement: 50,
        projetId: 'proj_001',
        createdBy: 'user_001',
        createdAt: new Date('2025-06-22T00:00:00'),
        updatedAt: new Date('2025-06-22T08:00:00'),
      },
      createOperation({
        id: '4',
        nom: 'Traitement de surface',
        description: 'Galvanisation à chaud',
        type: TypeOperation.FINITION,
        tempsEstime: 120,
        statut: OperationStatut.EN_ATTENTE,
        ordreId: '2',
        ordre: 2,
        createdAt: new Date('2025-06-22T00:00:00'),
        updatedAt: new Date('2025-06-22T00:00:00'),
      }),
    ],
  },
  {
    id: '3',
    numero: 'OF-2025-0091',
    dateDebut: new Date('2025-06-25'),
    progression: 0,
    statut: StatutProduction.EN_PREPARATION,
    priorite: PrioriteProduction.BASSE,
    operations: [
      createOperation({
        id: '5',
        nom: 'Usinage',
        description: 'Perçage et taraudage',
        type: TypeOperation.USINAGE,
        tempsEstime: 180,
        statut: OperationStatut.EN_ATTENTE,
        ordreId: '3',
        ordre: 1,
        createdAt: new Date('2025-06-25T00:00:00'),
        updatedAt: new Date('2025-06-25T00:00:00'),
      }),
      createOperation({
        id: '6',
        nom: 'Contrôle qualité',
        description: 'Vérification dimensionnelle',
        type: TypeOperation.CONTROLE,
        tempsEstime: 60,
        statut: OperationStatut.EN_ATTENTE,
        ordreId: '3',
        ordre: 2,
        createdAt: new Date('2025-06-25T00:00:00'),
        updatedAt: new Date('2025-06-25T00:00:00'),
      }),
    ],
  },
]

// Helper pour créer une opération complète
function createOperation(partial: Partial<Operation> & { id: string; nom: string }): Operation {
  const now = new Date()
  return {
    id: partial.id,
    nom: partial.nom,
    description: partial.description || '',
    type: partial.type || TypeOperation.ASSEMBLAGE,
    statut: partial.statut || OperationStatut.EN_ATTENTE,
    priorite: partial.priorite || PrioriteProduction.NORMALE,
    ordre: partial.ordre || 1,
    schedule: partial.schedule || {
      dateDebut: now,
      dateFin: new Date(now.getTime() + 4 * 60 * 60 * 1000), // +4h
      dureeEstimee: 4,
    },
    prerequis: partial.prerequis || [],
    machineId: partial.machineId,
    operateurIds: partial.operateurIds || [],
    outillage: partial.outillage || [],
    instructions: partial.instructions,
    parametres: partial.parametres || {},
    qualite: partial.qualite || {
      normes: [],
      tolerances: {},
      controles: [],
      certificationsRequises: [],
    },
    tempsEstime: partial.tempsEstime || 240,
    tempsReel: partial.tempsReel,
    avancement: partial.avancement || 0,
    ordreId: partial.ordreId || '',
    projetId: partial.projetId || 'proj_001',
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
    createdBy: partial.createdBy || 'user_001',
  }
}

export function ProjetProductionTab({ projet }: ProjetProductionTabProps) {
  const [selectedOF, setSelectedOF] = useState(mockOrdresFabrication[0])

  const getStatutBadge = (statut: StatutProduction) => {
    const statusConfig = {
      [StatutProduction.NON_COMMENCE]: {
        label: 'Planifié',
        variant: 'outline' as const,
        icon: Calendar,
      },
      [StatutProduction.EN_COURS]: {
        label: 'En cours',
        variant: 'default' as const,
        icon: Play,
      },
      [StatutProduction.EN_PAUSE]: {
        label: 'En pause',
        variant: 'secondary' as const,
        icon: Pause,
      },
      [StatutProduction.TERMINE]: {
        label: 'Terminé',
        variant: 'secondary' as const,
        icon: CheckCircle2,
      },
      [StatutProduction.REJETE]: {
        label: 'Annulé',
        variant: 'destructive' as const,
        icon: AlertCircle,
      },
      [StatutProduction.EN_PREPARATION]: {
        label: 'En préparation',
        variant: 'secondary' as const,
        icon: Settings,
      },
      [StatutProduction.CONTROLE_QUALITE]: {
        label: 'Contrôle qualité',
        variant: 'default' as const,
        icon: CheckCircle2,
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
      [PrioriteProduction.CRITIQUE]: {
        label: 'Urgente',
        variant: 'destructive' as const,
      },
    }

    const config = prioriteConfig[priorite]

    if (!config) return null

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getOperationStatusIcon = (statut: OperationStatut) => {
    switch (statut) {
      case OperationStatut.TERMINEE:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case OperationStatut.EN_COURS:
        return <Play className="h-4 w-4 text-blue-600" />
      case OperationStatut.EN_ATTENTE:
        return <Clock className="h-4 w-4 text-gray-400" />
      case OperationStatut.BLOQUEE:
        return <Pause className="h-4 w-4 text-orange-600" />
      case OperationStatut.ANNULEE:
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
              <button
                type="button"
                key={of.id}
                className={`rounded-lg border p-4 cursor-pointer transition-colors w-full text-left ${
                  selectedOF?.id === of.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedOF(of)}
                aria-label={`Sélectionner l'ordre de fabrication ${of.numero}`}
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
              </button>
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
                      {operation.operateurIds.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Opérateurs: {operation.operateurIds.length}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {operation.tempsReel || operation.tempsEstime}min
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {operation.tempsReel ? 'Réalisé' : 'Estimé'}
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
