// apps/web/src/components/production/production-table.tsx
'use client'

import { Badge, Button, Card, CardContent } from '@erp/ui'

import { AlertTriangle, CheckCircle, Clock, Edit, Eye, Pause, Play } from 'lucide-react'

interface ProductionTableProps {
  ordres: OrdreFabrication[]
  onView: (id: number) => void
  onEdit: (id: number) => void
  onStatusChange: (id: number, status: string) => void
}

interface OrdreFabrication {
  id: number
  numero: string
  description?: string
  statut: string
  priorite: string
  avancement: number
  dateDebutPrevue?: Date
  dateFinPrevue?: Date
  responsable?: string
  projet?: string
}

const StatusBadge = ({ statut }: { statut: string }) => {
  const config = {
    EN_ATTENTE: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
    PLANIFIE: { label: 'Planifié', variant: 'default' as const, icon: Clock },
    EN_COURS: { label: 'En cours', variant: 'default' as const, icon: Play },
    TERMINE: { label: 'Terminé', variant: 'default' as const, icon: CheckCircle },
    PAUSE: { label: 'Pause', variant: 'secondary' as const, icon: Pause },
    ANNULE: { label: 'Annulé', variant: 'destructive' as const, icon: AlertTriangle },
  }

  const { label, variant, icon: Icon } = config[statut as keyof typeof config] || config.EN_ATTENTE

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

const PrioriteBadge = ({ priorite }: { priorite: string }) => {
  const config = {
    BASSE: { label: 'Basse', className: 'bg-gray-100 text-gray-800' },
    NORMALE: { label: 'Normale', className: 'bg-blue-100 text-blue-800' },
    HAUTE: { label: 'Haute', className: 'bg-orange-100 text-orange-800' },
    URGENTE: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
  }

  const { label, className } = config[priorite as keyof typeof config] || config.NORMALE

  return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{label}</span>
}

export function ProductionTable({ ordres, onView, onEdit, _onStatusChange }: ProductionTableProps) {
  return (
    <div className="space-y-4">
      {ordres.map((ordre) => (
        <Card key={ordre.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-medium">{ordre.numero}</h3>
                  <p className="text-sm text-muted-foreground">{ordre.description}</p>
                </div>
                <StatusBadge statut={ordre.statut} />
                <PrioriteBadge priorite={ordre.priorite} />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onView(ordre.id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(ordre.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
