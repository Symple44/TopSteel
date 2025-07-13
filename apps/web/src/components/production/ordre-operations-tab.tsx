// apps/web/src/components/production/ordre-operations-tab.tsx
import { type Operation, OperationStatut, type OrdreFabrication } from '@erp/types'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'

interface OrdreOperationsTabProps {
  ordre: OrdreFabrication
}

export function OrdreOperationsTab({ ordre }: OrdreOperationsTabProps) {
  // Simulation d'opérations pour la démo (ordre.operationsIds contiendrait les IDs)
  const operations: Operation[] = []

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
              {operations.map((operation: Operation, index: number) => (
                <div key={operation.id || index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{operation?.nom || `Opération ${index + 1}`}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        operation?.statut === OperationStatut.TERMINE
                          ? 'bg-green-100 text-green-800'
                          : operation?.statut === OperationStatut.EN_COURS
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {operation?.statut || OperationStatut.EN_ATTENTE}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium">Machine</span>
                      <p className="text-sm text-muted-foreground">
                        {operation?.machineId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Durée estimée</span>
                      <p className="text-sm text-muted-foreground">
                        {operation?.dureeEstimee || 0}h
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Technicien</span>
                      <p className="text-sm text-muted-foreground">
                        {operation?.technicienId || 'Non assigné'}
                      </p>
                    </div>
                  </div>

                  {operation?.description && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">Instructions</span>
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
