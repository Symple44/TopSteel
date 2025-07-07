// apps/web/src/components/production/create-ordre-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CreateOrdreDialogProps {
  open: boolean;  // ✅ Interface standardisée
  onOpenChange: (open: boolean) => void;  // ✅ Interface standardisée
  onSubmit?: (data: unknown) => void;
}

export function CreateOrdreDialog({ open, onOpenChange, onSubmit }: CreateOrdreDialogProps) {
  const [formData, setFormData] = useState({
    numero: '',
    description: '',
    priorite: 'NORMALE',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    projet: ''
  });

  if (!open) return null;

  const _handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const _newOrdre = {
      ...formData,
      id: Date.now(),
      statut: 'PLANIFIE',
      avancement: 0,
      createdAt: new Date()
    };
    
    console.log('Nouvel ordre créé:', newOrdre);
    onSubmit?.(newOrdre);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      numero: '',
      description: '',
      priorite: 'NORMALE',
      dateDebutPrevue: '',
      dateFinPrevue: '',
      projet: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Nouvel ordre de fabrication</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Numéro d'ordre</label>
              <Input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: (e.target as HTMLInputElement).value })}
                placeholder="OF-2025-001"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: (e.target as HTMLInputElement).value })}
                placeholder="Description de l'ordre..."
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Priorité</label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: (e.target as HTMLSelectElement).value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="BASSE">Basse</option>
                <option value="NORMALE">Normale</option>
                <option value="HAUTE">Haute</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date début</label>
                <Input
                  type="date"
                  value={formData.dateDebutPrevue}
                  onChange={(e) => setFormData({ ...formData, dateDebutPrevue: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  value={formData.dateFinPrevue}
                  onChange={(e) => setFormData({ ...formData, dateFinPrevue: (e.target as HTMLInputElement).value })}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Projet associé</label>
              <Input
                type="text"
                value={formData.projet}
                onChange={(e) => setFormData({ ...formData, projet: (e.target as HTMLInputElement).value })}
                placeholder="Nom du projet (optionnel)"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Créer l'ordre
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
