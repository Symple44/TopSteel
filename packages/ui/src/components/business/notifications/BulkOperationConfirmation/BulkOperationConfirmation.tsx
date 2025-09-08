'use client'
import { AlertTriangle, Calendar, Factory, Hash, Package, Users } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives'
export type BulkOperationType =
  | 'delete_orders'
  | 'update_prices'
  | 'change_status'
  | 'assign_supplier'
  | 'update_delivery_dates'
  | 'archive_projects'
  | 'export_data'
export interface BulkOperationItem {
  id: string
  name: string
  type?: string
  currentValue?: string
  newValue?: string
}
export interface BulkOperationConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: BulkOperationType
  items: BulkOperationItem[]
  targetValue?: string
  estimatedDuration?: number
  onConfirm: (data: {
    operation: BulkOperationType
    items: BulkOperationItem[]
    targetValue?: string
  }) => Promise<void>
}
const operationConfig = {
  delete_orders: {
    title: 'Supprimer les commandes sélectionnées',
    description: 'Cette action supprimera définitivement les commandes sélectionnées',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    actionText: 'Supprimer',
    warningText: 'Cette action est irréversible',
  },
  update_prices: {
    title: 'Mettre à jour les prix',
    description: 'Appliquer les nouveaux prix aux articles sélectionnés',
    icon: Package,
    variant: 'default' as const,
    actionText: 'Mettre à jour',
    warningText: 'Les prix seront modifiés immédiatement',
  },
  change_status: {
    title: 'Changer le statut',
    description: 'Modifier le statut des éléments sélectionnés',
    icon: Factory,
    variant: 'default' as const,
    actionText: 'Changer',
    warningText: 'Le statut sera mis à jour pour tous les éléments',
  },
  assign_supplier: {
    title: 'Assigner un fournisseur',
    description: 'Attribuer le fournisseur aux articles sélectionnés',
    icon: Users,
    variant: 'default' as const,
    actionText: 'Assigner',
    warningText: 'Le fournisseur sera changé pour tous les articles',
  },
  update_delivery_dates: {
    title: 'Mettre à jour les dates de livraison',
    description: 'Modifier les dates de livraison prévues',
    icon: Calendar,
    variant: 'default' as const,
    actionText: 'Mettre à jour',
    warningText: 'Les dates seront mises à jour automatiquement',
  },
  archive_projects: {
    title: 'Archiver les projets',
    description: 'Déplacer les projets vers les archives',
    icon: Package,
    variant: 'default' as const,
    actionText: 'Archiver',
    warningText: 'Les projets ne seront plus visibles dans la liste active',
  },
  export_data: {
    title: 'Exporter les données',
    description: 'Générer un export des données sélectionnées',
    icon: Hash,
    variant: 'default' as const,
    actionText: 'Exporter',
    warningText: "L'export peut prendre quelques minutes",
  },
}
export function BulkOperationConfirmation({
  open,
  onOpenChange,
  operation,
  items,
  targetValue,
  estimatedDuration,
  onConfirm,
}: BulkOperationConfirmationProps) {
  const [loading, setLoading] = useState(false)
  const config = operationConfig[operation]
  const IconComponent = config.icon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onConfirm({ operation, items, targetValue })
      onOpenChange(false)
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`
    return `${Math.round(seconds / 3600)}h`
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {config.title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{config.description}</p>
            {targetValue && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Nouvelle valeur:</p>
                <p className="text-sm text-muted-foreground">{targetValue}</p>
              </div>
            )}
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-medium mb-3">Éléments sélectionnés ({items.length})</h4>
              <div className="space-y-2">
                {items.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.name}</span>
                    {item.type && <span className="text-muted-foreground">{item.type}</span>}
                  </div>
                ))}
                {items.length > 10 && (
                  <p className="text-xs text-muted-foreground">
                    +{items.length - 10} éléments supplémentaires
                  </p>
                )}
              </div>
            </div>
            {estimatedDuration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Durée estimée: {formatDuration(estimatedDuration)}
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">{config.warningText}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} variant={config.variant}>
              {loading ? 'En cours...' : config.actionText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
