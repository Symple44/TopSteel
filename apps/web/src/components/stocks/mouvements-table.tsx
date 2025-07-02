// apps/web/src/components/stocks/mouvements-table.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from "@erp/ui";
import { Search, ArrowRight, ArrowLeft, RotateCcw, Package, Calendar, User } from "lucide-react";

interface Mouvement {
  id: string;
  type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT';
  materiau: string;
  quantite: number;
  unite: string;
  prixUnitaire?: number;
  motif: string;
  reference?: string;
  emplacementSource?: string;
  emplacementDestination?: string;
  utilisateur: string;
  dateCreation: Date;
  notes?: string;
}

interface MouvementsTableProps {
  mouvements: Mouvement[];
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
}

export function MouvementsTable({ mouvements, onSearch, onFilter }: MouvementsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const getTypeBadge = (type: string) => {
    const config = {
      ENTREE: { 
        label: 'Entrée', 
        icon: ArrowRight, 
        className: 'bg-green-100 text-green-800',
        variant: 'default' as const 
      },
      SORTIE: { 
        label: 'Sortie', 
        icon: ArrowLeft, 
        className: 'bg-red-100 text-red-800',
        variant: 'destructive' as const 
      },
      TRANSFERT: { 
        label: 'Transfert', 
        icon: RotateCcw, 
        className: 'bg-blue-100 text-blue-800',
        variant: 'default' as const 
      },
      AJUSTEMENT: { 
        label: 'Ajustement', 
        icon: Package, 
        className: 'bg-purple-100 text-purple-800',
        variant: 'secondary' as const 
      },
    };

    const { label, icon: Icon, className } = config[type as keyof typeof config] || config.AJUSTEMENT;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    onFilter({ type: type || undefined });
  };

  const formatCurrency = (amount?: number) => {
    return amount ? `${amount.toLocaleString()} €` : '-';
  };

  if (mouvements.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun mouvement trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historique des Mouvements ({mouvements.length})</CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Filtre par type */}
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter((e.target as HTMLInputElement | HTMLTextAreaElement).value)}
              className="p-2 border rounded-md text-sm"
            >
              <option value="">Tous les types</option>
              <option value="ENTREE">Entrées</option>
              <option value="SORTIE">Sorties</option>
              <option value="TRANSFERT">Transferts</option>
              <option value="AJUSTEMENT">Ajustements</option>
            </select>

            {/* Recherche */}
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
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Matériau</th>
                <th className="text-left p-3">Quantité</th>
                <th className="text-left p-3">Prix unitaire</th>
                <th className="text-left p-3">Motif</th>
                <th className="text-left p-3">Référence</th>
                <th className="text-left p-3">Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((mouvement) => (
                <tr key={mouvement.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(mouvement.dateCreation).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(mouvement.dateCreation).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {getTypeBadge(mouvement.type)}
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{mouvement.materiau}</div>
                      {mouvement.type === 'TRANSFERT' && (
                        <div className="text-xs text-muted-foreground">
                          {mouvement.emplacementSource} → {mouvement.emplacementDestination}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">
                      {mouvement.quantite} {mouvement.unite}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      {formatCurrency(mouvement.prixUnitaire)}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="max-w-48">
                      <div className="text-sm">{mouvement.motif}</div>
                      {mouvement.notes && (
                        <div className="text-xs text-muted-foreground truncate">
                          {mouvement.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-muted-foreground">
                      {mouvement.reference || '-'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{mouvement.utilisateur}</span>
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

