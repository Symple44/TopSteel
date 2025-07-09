// apps/web/src/components/production/ordre-info-tab.tsx

import {
  Card,
  CardContent, CardHeader, CardTitle, Label
} from '@erp/ui'

interface OrdreInfoTabProps {
  ordre: any
}

export function OrdreInfoTab({ ordre }: OrdreInfoTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Numéro d'ordre</Label>
              <p className="text-sm text-muted-foreground">{ordre?.numero || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Statut</Label>
              <p className="text-sm text-muted-foreground">{ordre?.statut || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Priorité</Label>
              <p className="text-sm text-muted-foreground">{ordre?.priorite || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Avancement</Label>
              <p className="text-sm text-muted-foreground">{ordre?.avancement || 0}%</p>
            </div>
          </div>

          {ordre?.description && (
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">{ordre.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Date début prévue</Label>
              <p className="text-sm text-muted-foreground">
                {ordre?.dateDebutPrevue
                  ? new Date(ordre.dateDebutPrevue).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Date fin prévue</Label>
              <p className="text-sm text-muted-foreground">
                {ordre?.dateFinPrevue ? new Date(ordre.dateFinPrevue).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



