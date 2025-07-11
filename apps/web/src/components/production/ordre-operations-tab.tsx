// apps/web/src/components/production/ordre-operations-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'

interface OrdreOperationsTabProps {
  ordre: unknown
}

export function OrdreOperationsTab({ ordre }: OrdreOperationsTabProps) {
  const operations = ordre?.operations || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Opérations de fabrication</CardTitle>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune opération définie pour cet ordre</p>
          ) : (
            <div className="space-y-4">
              {operations.map((operation: unknown, index: number) => (
                <div key={operation.id || index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{operation?.nom || `Opération ${index + 1}`}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        operation?.statut === 'TERMINE'
                          ? 'bg-green-100 text-green-800'
                          : operation?.statut === 'EN_COURS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {operation?.statut || 'EN_ATTENTE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Machine</label>
                      <p className="text-sm text-muted-foreground">{operation?.machine || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Durée estimée</label>
                      <p className="text-sm text-muted-foreground">
                        {operation?.dureeEstimee || 0}h
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Technicien</label>
                      <p className="text-sm text-muted-foreground">
                        {operation?.technicien || 'Non assigné'}
                      </p>
                    </div>
                  </div>

                  {operation?.description && (
                    <div className="mt-2">
                      <label className="text-sm font-medium">Instructions</label>
                      <p className="text-sm text-muted-foreground">{operation.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

