// apps/web/src/components/production/production-table.tsx
"use client";

import { Badge } from "@/components/ui/badge";`nimport { Button } from "@/components/ui/button";`nimport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Edit, Play, Pause, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface ProductionTableProps {
  ordres: OrdreFabrication[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}

interface OrdreFabrication {
  id: number;
  numero: string;
  description?: string;
  statut: string;
  priorite: string;
  avancement: number;
  dateDebutPrevue?: Date;
  dateFinPrevue?: Date;
  responsable?: string;
  projet?: string;
}

const StatusBadge = ({ statut }: { statut: string }) => {
  const config = {
    EN_ATTENTE: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
    PLANIFIE: { label: 'Planifié', variant: 'default' as const, icon: Clock },
    EN_COURS: { label: 'En cours', variant: 'default' as const, icon: Play },
    TERMINE: { label: 'Terminé', variant: 'default' as const, icon: CheckCircle },
    PAUSE: { label: 'Pause', variant: 'secondary' as const, icon: Pause },
    ANNULE: { label: 'Annulé', variant: 'destructive' as const, icon: AlertTriangle },
  };

  const { label, variant, icon: Icon } = config[statut as keyof typeof config] || config.EN_ATTENTE;

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

const PrioriteBadge = ({ priorite }: { priorite: string }) => {
  const config = {
    BASSE: { label: 'Basse', className: 'bg-gray-100 text-gray-800' },
    NORMALE: { label: 'Normale', className: 'bg-blue-100 text-blue-800' },
    HAUTE: { label: 'Haute', className: 'bg-orange-100 text-orange-800' },
    URGENTE: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
  };

  const { label, className } = config[priorite as keyof typeof config] || config.NORMALE;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

export function ProductionTable({ ordres, onView, onEdit, onStatusChange }: ProductionTableProps) {
  if (ordres.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Aucun ordre de fabrication trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ordres de fabrication ({ordres.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Numéro</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Statut</th>
                <th className="text-left p-2">Priorité</th>
                <th className="text-left p-2">Avancement</th>
                <th className="text-left p-2">Date fin prévue</th>
                <th className="text-left p-2">Responsable</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordres.map((ordre) => (
                <tr key={ordre.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{ordre.numero}</td>
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{ordre.description || 'Sans description'}</div>
                      {ordre.projet && (
                        <div className="text-sm text-muted-foreground">{ordre.projet}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <StatusBadge statut={ordre.statut} />
                  </td>
                  <td className="p-2">
                    <PrioriteBadge priorite={ordre.priorite} />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${ordre.avancement}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{ordre.avancement}%</span>
                    </div>
                  </td>
                  <td className="p-2">
                    {ordre.dateFinPrevue ? new Date(ordre.dateFinPrevue).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-2">{ordre.responsable || 'Non assigné'}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(ordre.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(ordre.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
