// apps/web/src/components/production/create-ordre-dialog.tsx
"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@erp/ui";

interface CreateOrdreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateOrdreDialog({ isOpen, onClose, onSubmit }: CreateOrdreDialogProps) {
  const [formData, setFormData] = useState({
    numero: '',
    description: '',
    priorite: 'NORMALE',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    projet: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
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
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Nouvel ordre de fabrication</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Numéro d'ordre</label>
              <Input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: (e.target as HTMLInputElement | HTMLTextAreaElement).value })}
                placeholder="OF-2025-001"
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: (e.target as HTMLInputElement | HTMLTextAreaElement).value })}
                placeholder="Description de l'ordre..."
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Priorité</label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: (e.target as HTMLInputElement | HTMLTextAreaElement).value })}
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
                  onChange={(e) => setFormData({ ...formData, dateDebutPrevue: (e.target as HTMLInputElement | HTMLTextAreaElement).value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  value={formData.dateFinPrevue}
                  onChange={(e) => setFormData({ ...formData, dateFinPrevue: (e.target as HTMLInputElement | HTMLTextAreaElement).value })}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Projet associé</label>
              <Input
                type="text"
                value={formData.projet}
                onChange={(e) => setFormData({ ...formData, projet: (e.target as HTMLInputElement | HTMLTextAreaElement).value })}
                placeholder="Nom du projet (optionnel)"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
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

