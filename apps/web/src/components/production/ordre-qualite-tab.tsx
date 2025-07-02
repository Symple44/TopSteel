// apps/web/src/components/production/ordre-qualite-tab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@erp/ui";

interface OrdreQualiteTabProps {
  ordre: any;
}

export function OrdreQualiteTab({ ordre }: OrdreQualiteTabProps) {
  const controles = ordre?.controles || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contrôles qualité</CardTitle>
        </CardHeader>
        <CardContent>
          {controles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">Aucun contrôle qualité enregistré</p>
              <p className="text-xs text-muted-foreground">
                Les contrôles qualité seront ajoutés au fur et à mesure de l'avancement de la production
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {controles.map((controle: any, index: number) => (
                <div key={controle.id || index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{controle?.type || 'Contrôle qualité'}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      controle?.resultat === 'CONFORME' ? 'bg-green-100 text-green-800' :
                      controle?.resultat === 'NON_CONFORME' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {controle?.resultat || 'EN_ATTENTE'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Date contrôle</label>
                      <p className="text-sm text-muted-foreground">
                        {controle?.dateControle ? new Date(controle.dateControle).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contrôleur</label>
                      <p className="text-sm text-muted-foreground">{controle?.controleur || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {controle?.observations && (
                    <div className="mt-2">
                      <label className="text-sm font-medium">Observations</label>
                      <p className="text-sm text-muted-foreground">{controle.observations}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Spécifications techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tolérances dimensionnelles</label>
              <p className="text-sm text-muted-foreground">±0.5mm (standard métallerie)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Finition requise</label>
              <p className="text-sm text-muted-foreground">{ordre?.finition || 'Selon plan'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Normes applicables</label>
              <p className="text-sm text-muted-foreground">EN 1090, CE</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
