// apps/web/src/components/production/production-filters.tsx
"use client";

import { useState } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@erp/ui";
import { Search, Filter, RotateCcw } from "lucide-react";

interface ProductionFiltersProps {
  onFiltersChange: (filters: ProductionFilters) => void;
  onReset: () => void;
}

interface ProductionFilters {
  search?: string;
  statut?: string[];
  priorite?: string[];
  dateDebut?: string;
  dateFin?: string;
  responsable?: string;
}

export function ProductionFilters({ onFiltersChange, onReset }: ProductionFiltersProps) {
  const [filters, setFilters] = useState<ProductionFilters>({});

  const handleFilterChange = (key: keyof ProductionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres de production
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Numéro, description..."
                className="pl-10"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <select
              className="w-full p-2 border rounded-md"
              value={filters.statut?.[0] || ''}
              onChange={(e) => handleFilterChange('statut', e.target.value ? [e.target.value] : [])}
            >
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="PAUSE">En pause</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priorité</label>
            <select
              className="w-full p-2 border rounded-md"
              value={filters.priorite?.[0] || ''}
              onChange={(e) => handleFilterChange('priorite', e.target.value ? [e.target.value] : [])}
            >
              <option value="">Toutes les priorités</option>
              <option value="BASSE">Basse</option>
              <option value="NORMALE">Normale</option>
              <option value="HAUTE">Haute</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date début */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date début</label>
            <Input
              type="date"
              value={filters.dateDebut || ''}
              onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
            />
          </div>

          {/* Date fin */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date fin</label>
            <Input
              type="date"
              value={filters.dateFin || ''}
              onChange={(e) => handleFilterChange('dateFin', e.target.value)}
            />
          </div>

          {/* Responsable */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Responsable</label>
            <Input
              placeholder="Nom du responsable"
              value={filters.responsable || ''}
              onChange={(e) => handleFilterChange('responsable', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
