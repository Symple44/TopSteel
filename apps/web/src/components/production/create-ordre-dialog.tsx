'use client'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui'

import { useState } from 'react'

interface CreateOrdreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: unknown) => void
}

export function CreateOrdreDialog({ open, onOpenChange, onSubmit }: CreateOrdreDialogProps) {
  const [formData, setFormData] = useState({
    numero: '',
    description: '',
    priorite: 'NORMALE',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    projet: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newOrdre = {
      ...formData,
      id: Date.now(),
      statut: 'PLANIFIE',
      avancement: 0,
      createdAt: new Date(),
    }
    onSubmit?.(newOrdre)
    onOpenChange(false)

    // Reset form
    setFormData({
      numero: '',
      description: '',
      priorite: 'NORMALE',
      dateDebutPrevue: '',
      dateFinPrevue: '',
      projet: '',
    })
  }

  // ✅ Handler simplifié pour les inputs
  const handleInputChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel ordre de fabrication</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {/* ✅ COHÉRENCE : Utilise toujours <Label> component */}
            <Label htmlFor="numero" className="text-sm font-medium">
              Numéro d'ordre
            </Label>
            <Input
              id="numero"
              type="text"
              value={formData.numero}
              onChange={handleInputChange('numero')}
              placeholder="OF-2025-001"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Description de l'ordre..."
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Priorité</Label>
            {/* ✅ CORRIGÉ : Utilise l'API Radix UI Select correcte */}
            <Select
              value={formData.priorite}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, priorite: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASSE">Basse</SelectItem>
                <SelectItem value="NORMALE">Normale</SelectItem>
                <SelectItem value="HAUTE">Haute</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut" className="text-sm font-medium">
                Date début
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={formData.dateDebutPrevue}
                onChange={handleInputChange('dateDebutPrevue')}
              />
            </div>
            <div>
              <Label htmlFor="dateFin" className="text-sm font-medium">
                Date fin
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={formData.dateFinPrevue}
                onChange={handleInputChange('dateFinPrevue')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="projet" className="text-sm font-medium">
              Projet associé
            </Label>
            <Input
              id="projet"
              type="text"
              value={formData.projet}
              onChange={handleInputChange('projet')}
              placeholder="Nom du projet (optionnel)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer l'ordre</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ✅ BONUS : Version avec validation avancée
export function CreateOrdreDialogAdvanced({
  open,
  onOpenChange,
  onSubmit,
}: CreateOrdreDialogProps) {
  const [formData, setFormData] = useState({
    numero: '',
    description: '',
    priorite: 'NORMALE',
    dateDebutPrevue: '',
    dateFinPrevue: '',
    projet: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ✅ Validation des champs
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.numero.trim()) {
      newErrors.numero = "Le numéro d'ordre est requis"
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise'
    }

    if (formData.dateDebutPrevue && formData.dateFinPrevue) {
      if (new Date(formData.dateDebutPrevue) > new Date(formData.dateFinPrevue)) {
        newErrors.dateFinPrevue = 'La date de fin doit être postérieure à la date de début'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const newOrdre = {
      ...formData,
      id: Date.now(),
      statut: 'PLANIFIE' as const,
      avancement: 0,
      createdAt: new Date(),
    }

    onSubmit?.(newOrdre)
    onOpenChange(false)

    // Reset form et erreurs
    setFormData({
      numero: '',
      description: '',
      priorite: 'NORMALE',
      dateDebutPrevue: '',
      dateFinPrevue: '',
      projet: '',
    })
    setErrors({})
  }

  const handleInputChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }))
      }
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel ordre de fabrication</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="numero" className="text-sm font-medium">
              Numéro d'ordre *
            </Label>
            <Input
              id="numero"
              type="text"
              value={formData.numero}
              onChange={handleInputChange('numero')}
              placeholder="OF-2025-001"
              className={errors.numero ? 'border-red-500' : ''}
            />
            {errors.numero && <p className="text-sm text-red-500 mt-1">{errors.numero}</p>}
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Description de l'ordre..."
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium">Priorité</Label>
            <Select
              value={formData.priorite}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, priorite: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASSE">🟢 Basse</SelectItem>
                <SelectItem value="NORMALE">🟡 Normale</SelectItem>
                <SelectItem value="HAUTE">🟠 Haute</SelectItem>
                <SelectItem value="URGENTE">🔴 Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut" className="text-sm font-medium">
                Date début
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={formData.dateDebutPrevue}
                onChange={handleInputChange('dateDebutPrevue')}
              />
            </div>
            <div>
              <Label htmlFor="dateFin" className="text-sm font-medium">
                Date fin
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={formData.dateFinPrevue}
                onChange={handleInputChange('dateFinPrevue')}
                className={errors.dateFinPrevue ? 'border-red-500' : ''}
              />
              {errors.dateFinPrevue && (
                <p className="text-sm text-red-500 mt-1">{errors.dateFinPrevue}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="projet" className="text-sm font-medium">
              Projet associé
            </Label>
            <Input
              id="projet"
              type="text"
              value={formData.projet}
              onChange={handleInputChange('projet')}
              placeholder="Nom du projet (optionnel)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer l'ordre</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
