// apps/web/src/components/production/ordre-materiaux-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui";

interface OrdreMatieriauxTabProps {
  ordre: any;
}

export function OrdreMateriaux({ ordre }: OrdreMatieriauxTabProps) {
  const materiaux = ordre?.materiaux || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Matériaux requis</CardTitle>
        </CardHeader>
        <CardContent>
          {materiaux.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun matériau défini pour cet ordre</p>
          ) : (
            <div className="space-y-4">
              {materiaux.map((materiau: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Référence</label>
                      <p className="text-sm text-muted-foreground">{materiau?.reference || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Quantité</label>
                      <p className="text-sm text-muted-foreground">{materiau?.quantite || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Unité</label>
                      <p className="text-sm text-muted-foreground">{materiau?.unite || 'N/A'}</p>
                    </div>
                  </div>
                  {materiau?.description && (
                    <div className="mt-2">
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-muted-foreground">{materiau.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
