// apps/web/src/components/production/ordre-info-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
              <label className="text-sm font-medium">Numéro d'ordre</label>
              <p className="text-sm text-muted-foreground">{ordre?.numero || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Statut</label>
              <p className="text-sm text-muted-foreground">{ordre?.statut || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Priorité</label>
              <p className="text-sm text-muted-foreground">{ordre?.priorite || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Avancement</label>
              <p className="text-sm text-muted-foreground">{ordre?.avancement || 0}%</p>
            </div>
          </div>

          {ordre?.description && (
            <div>
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-muted-foreground">{ordre.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date début prévue</label>
              <p className="text-sm text-muted-foreground">
                {ordre?.dateDebutPrevue
                  ? new Date(ordre.dateDebutPrevue).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Date fin prévue</label>
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
