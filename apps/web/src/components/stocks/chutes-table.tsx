// apps/web/src/components/stocks/chutes-table.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@erp/ui";
import { Search, Eye, Edit, Trash2, Package, MapPin } from "lucide-react";

interface Chute {
  id: string;
  reference: string;
  materiau: string;
  dimensions: {
    longueur: number;
    largeur: number;
    epaisseur: number;
  };
  quantite: number;
  unite: string;
  qualite: 'EXCELLENTE' | 'BONNE' | 'ACCEPTABLE' | 'DEGRADEE';
  emplacement: string;
  valeurEstimee: number;
  dateCreation: Date;
  notes?: string;
}

interface ChutesTableProps {
  chutes: Chute[];
  onView: (chute: Chute) => void;
  onEdit: (chute: Chute) => void;
  onDelete: (chuteId: string) => void;
  onSearch: (query: string) => void;
}

export function ChutesTable({ chutes, onView, onEdit, onDelete, onSearch }: ChutesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const getQualityBadge = (qualite: string) => {
    const config = {
      EXCELLENTE: { label: 'Excellente', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      BONNE: { label: 'Bonne', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      ACCEPTABLE: { label: 'Acceptable', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      DEGRADEE: { label: 'Dégradée', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const { label, className } = config[qualite as keyof typeof config] || config.ACCEPTABLE;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  if (chutes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune chute trouvée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chutes en Stock ({chutes.length})</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => handleSearch((e.target as HTMLInputElement | HTMLTextAreaElement).value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Référence</th>
                <th className="text-left p-3">Matériau</th>
                <th className="text-left p-3">Dimensions</th>
                <th className="text-left p-3">Quantité</th>
                <th className="text-left p-3">Qualité</th>
                <th className="text-left p-3">Emplacement</th>
                <th className="text-left p-3">Valeur</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chutes.map((chute) => (
                <tr key={chute.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{chute.reference}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(chute.dateCreation).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{chute.materiau}</div>
                    {chute.notes && (
                      <div className="text-sm text-muted-foreground truncate max-w-32">
                        {chute.notes}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      {chute.dimensions.longueur} × {chute.dimensions.largeur} × {chute.dimensions.epaisseur} mm
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">
                      {chute.quantite} {chute.unite}
                    </div>
                  </td>
                  <td className="p-3">
                    {getQualityBadge(chute.qualite)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{chute.emplacement}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-green-600">
                      {chute.valeurEstimee.toLocaleString()} €
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(chute)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(chute)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(chute.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
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

