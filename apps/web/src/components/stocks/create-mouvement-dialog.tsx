// apps/web/src/components/stocks/create-mouvement-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, X, Package, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";

interface CreateMouvementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mouvement: MouvementData) => void;
}

interface MouvementData {
  type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT';
  materiauId: string;
  quantite: number;
  prixUnitaire?: number;
  motif: string;
  reference?: string;
  emplacementSource?: string;
  emplacementDestination?: string;
  notes?: string;
}

export function CreateMouvementDialog({ isOpen, onClose, onSubmit }: CreateMouvementDialogProps) {
  const [formData, setFormData] = useState<MouvementData>({
    type: 'ENTREE',
    materiauId: '',
    quantite: 0,
    motif: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    setFormData({
      type: 'ENTREE',
      materiauId: '',
      quantite: 0,
      motif: '',
    });
  };

  const mouvementTypes = [
    { value: 'ENTREE', label: 'Entrée', icon: ArrowRight, color: 'text-green-600' },
    { value: 'SORTIE', label: 'Sortie', icon: ArrowLeft, color: 'text-red-600' },
    { value: 'TRANSFERT', label: 'Transfert', icon: RotateCcw, color: 'text-blue-600' },
    { value: 'AJUSTEMENT', label: 'Ajustement', icon: Package, color: 'text-purple-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Nouveau Mouvement de Stock
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type de mouvement */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Type de mouvement</label>
              <div className="grid grid-cols-2 gap-2">
                {mouvementTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${type.color}`} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matériau */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Matériau</label>
              <Input
                value={formData.materiauId}
                onChange={(e) => setFormData({ ...formData, materiauId: (e.target as HTMLInputElement).value })}
                placeholder="ID ou nom du matériau"
                required
              />
            </div>

            {/* Quantité */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantité</label>
              <Input
                type="number"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseFloat((e.target as HTMLInputElement).value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            {/* Motif */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Motif</label>
              <Input
                value={formData.motif}
                onChange={(e) => setFormData({ ...formData, motif: (e.target as HTMLInputElement).value })}
                placeholder="Raison du mouvement"
                required
              />
            </div>

            {/* Champs conditionnels selon le type */}
            {(formData.type === 'TRANSFERT' || formData.type === 'ENTREE') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emplacement source</label>
                  <Input
                    value={formData.emplacementSource || ''}
                    onChange={(e) => setFormData({ ...formData, emplacementSource: (e.target as HTMLInputElement).value })}
                    placeholder="Zone A1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emplacement destination</label>
                  <Input
                    value={formData.emplacementDestination || ''}
                    onChange={(e) => setFormData({ ...formData, emplacementDestination: (e.target as HTMLInputElement).value })}
                    placeholder="Zone B2"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: (e.target as HTMLTextAreaElement).value })}
                placeholder="Informations complémentaires..."
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">
                Créer le mouvement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}