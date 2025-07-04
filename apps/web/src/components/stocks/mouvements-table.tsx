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
  type?: string;
  mouvements?: Mouvement[];
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
}

export function MouvementsTable({ type, mouvements = [], onSearch, onFilter }: MouvementsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Mock data si aucune donnée fournie
  const mockMovements: Mouvement[] = [
    {
      id: "mov-001",
      type: "ENTREE",
      materiau: "Acier inoxydable 304",
      quantite: 500,
      unite: "kg",
      prixUnitaire: 8.5,
      motif: "Réapprovisionnement",
      reference: "BL-2024-001",
      utilisateur: "Marie Dupont",
      dateCreation: new Date(),
      notes: "Qualité contrôlée"
    }
  ];

  const displayMovements = mouvements.length > 0 ? mouvements : mockMovements;
  const filteredMovements = type && type !== 'tous' ? 
    displayMovements.filter(m => m.type.toLowerCase() === type.toLowerCase()) : 
    displayMovements;

  const getTypeBadge = (type: string) => {
    const config = {
      ENTREE: { 
        label: 'Entrée', 
        icon: ArrowRight, 
        className: 'bg-green-100 text-green-800'
      },
      SORTIE: { 
        label: 'Sortie', 
        icon: ArrowLeft, 
        className: 'bg-red-100 text-red-800'
      },
      TRANSFERT: { 
        label: 'Transfert', 
        icon: RotateCcw, 
        className: 'bg-blue-100 text-blue-800'
      },
      AJUSTEMENT: { 
        label: 'Ajustement', 
        icon: Package, 
        className: 'bg-purple-100 text-purple-800'
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mouvements {type && type !== 'tous' ? `- ${type}` : ''}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredMovements.length} mouvement(s)
          </span>
        </CardTitle>
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
              {filteredMovements.map((mouvement) => (
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
                    <span className="font-mono">{mouvement.quantite} {mouvement.unite}</span>
                  </td>
                  <td className="p-3">
                    {mouvement.prixUnitaire && (
                      <span className="font-mono">{mouvement.prixUnitaire.toFixed(2)}€</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="max-w-xs truncate" title={mouvement.motif}>
                      {mouvement.motif}
                    </div>
                  </td>
                  <td className="p-3">
                    {mouvement.reference && (
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {mouvement.reference}
                      </code>
                    )}
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
