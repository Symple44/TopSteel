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
  Textarea
} from '@erp/ui'

import { Package } from 'lucide-react'
import { useState } from 'react'

interface AddMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (material: MaterialFormData) => void
}

// ✅ Interface pour les données du matériau
interface MaterialFormData {
  reference: string
  designation: string
  quantite: number
  prixUnitaire: number
  emplacement: string
  seuil: number
  categorie: string
  unite: string
  fournisseur: string
  notes?: string
}

// ✅ Interface pour le formulaire (strings pour les inputs)
interface FormData {
  reference: string
  designation: string
  quantite: string
  prixUnitaire: string
  emplacement: string
  seuil: string
  categorie: string
  unite: string
  fournisseur: string
  notes: string
}

export function AddMaterialDialog({ open, onOpenChange, onSubmit }: AddMaterialDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    reference: '',
    designation: '',
    quantite: '',
    prixUnitaire: '',
    emplacement: '',
    seuil: '',
    categorie: '',
    unite: 'kg',
    fournisseur: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ✅ Handler simplifié et réutilisable
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // ✅ Handler pour les selects
  const handleSelectChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // ✅ Validation complète
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Champs requis
    if (!formData.reference.trim()) {
      newErrors.reference = 'La référence est requise'
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'La désignation est requise'
    }

    if (!formData.quantite.trim()) {
      newErrors.quantite = 'La quantité est requise'
    } else if (isNaN(Number(formData.quantite)) || Number(formData.quantite) <= 0) {
      newErrors.quantite = 'La quantité doit être un nombre positif'
    }

    if (!formData.categorie) {
      newErrors.categorie = 'La catégorie est requise'
    }

    // Validation optionnelle mais format correct
    if (formData.prixUnitaire && (isNaN(Number(formData.prixUnitaire)) || Number(formData.prixUnitaire) < 0)) {
      newErrors.prixUnitaire = 'Le prix doit être un nombre positif'
    }

    if (formData.seuil && (isNaN(Number(formData.seuil)) || Number(formData.seuil) < 0)) {
      newErrors.seuil = 'Le seuil doit être un nombre positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ Soumission avec validation et conversion des types
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const materialData: MaterialFormData = {
      reference: formData.reference.trim(),
      designation: formData.designation.trim(),
      quantite: Number(formData.quantite),
      prixUnitaire: formData.prixUnitaire ? Number(formData.prixUnitaire) : 0,
      emplacement: formData.emplacement.trim(),
      seuil: formData.seuil ? Number(formData.seuil) : 0,
      categorie: formData.categorie,
      unite: formData.unite,
      fournisseur: formData.fournisseur.trim(),
      notes: formData.notes.trim() || undefined,
    }

    console.log('Nouveau matériau:', materialData)
    onSubmit?.(materialData)
    handleReset()
    onOpenChange(false)
  }

  // ✅ Reset du formulaire
  const handleReset = () => {
    setFormData({
      reference: '',
      designation: '',
      quantite: '',
      prixUnitaire: '',
      emplacement: '',
      seuil: '',
      categorie: '',
      unite: 'kg',
      fournisseur: '',
      notes: '',
    })
    setErrors({})
  }

  // ✅ Annulation
  const handleCancel = () => {
    handleReset()
    onOpenChange(false)
  }

  // ✅ Helper pour les classes d'erreur
  const getInputClassName = (field: string) => {
    return errors[field] ? 'border-red-500' : ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un matériau
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ✅ Informations principales */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Informations principales</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference" className="text-sm font-medium">
                  Référence *
                </Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={handleInputChange('reference')
                  placeholder="REF-001"
                  className={getInputClassName('reference')}
                />
                {errors.reference && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.reference}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="categorie" className="text-sm font-medium">
                  Catégorie *
                </Label>
                <Select
                  value={formData.categorie}
                  onValueChange={handleSelectChange('categorie')}
                >
                  <SelectTrigger className={getInputClassName('categorie')}>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acier">🔩 Acier</SelectItem>
                    <SelectItem value="inox">✨ Inoxydable</SelectItem>
                    <SelectItem value="aluminium">⚡ Aluminium</SelectItem>
                    <SelectItem value="cuivre">🟤 Cuivre</SelectItem>
                    <SelectItem value="consommables">🔧 Consommables</SelectItem>
                    <SelectItem value="quincaillerie">🔗 Quincaillerie</SelectItem>
                  </SelectContent>
                </Select>
                {errors.categorie && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.categorie}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="designation" className="text-sm font-medium">
                Désignation *
              </Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={handleInputChange('designation')}
                placeholder="Acier S235 - Tôle 2mm"
                className={getInputClassName('designation')}
              />
              {errors.designation && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.designation}
                </p>
              )}
            </div>
          </div>

          {/* ✅ Quantité et unité */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Quantité et stock</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantite" className="text-sm font-medium">
                  Quantité *
                </Label>
                <Input
                  id="quantite"
                  type="number"
                  min="0"
                  value={formData.quantite}
                  onChange={handleInputChange('quantite')}
                  placeholder="100"
                  className={getInputClassName('quantite')}
                />
                {errors.quantite && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.quantite}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="unite" className="text-sm font-medium">
                  Unité
                </Label>
                <Select
                  value={formData.unite}
                  onValueChange={handleSelectChange('unite')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="t">t</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                    <SelectItem value="pièces">pièces</SelectItem>
                    <SelectItem value="litres">litres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="seuil" className="text-sm font-medium">
                  Seuil d'alerte
                </Label>
                <Input
                  id="seuil"
                  type="number"
                  min="0"
                  value={formData.seuil}
                  onChange={handleInputChange('seuil')} 
                  placeholder="10"
                  className={getInputClassName('seuil')}
                />
                {errors.seuil && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.seuil}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Informations financières et logistiques */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Informations complémentaires</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prixUnitaire" className="text-sm font-medium">
                  Prix unitaire (€)
                </Label>
                <Input
                  id="prixUnitaire"
                  type="number"
                  min="0"
                  value={formData.prixUnitaire}
                  onChange={handleInputChange('prixUnitaire')}
                  placeholder="12.50"
                  className={getInputClassName('prixUnitaire')}
                />
                {errors.prixUnitaire && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.prixUnitaire}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="fournisseur" className="text-sm font-medium">
                  Fournisseur
                </Label>
                <Input
                  id="fournisseur"
                  value={formData.fournisseur}
                  onChange={handleInputChange('fournisseur')}
                  placeholder="Nom du fournisseur"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="emplacement" className="text-sm font-medium">
                Emplacement
              </Label>
              <Select
                value={formData.emplacement}
                onValueChange={handleSelectChange('emplacement')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un emplacement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A1-B2-C3">📍 A1-B2-C3 (Atelier principal)</SelectItem>
                  <SelectItem value="A2-B1-C1">📍 A2-B1-C1 (Stock acier)</SelectItem>
                  <SelectItem value="B1-A3-C2">📍 B1-A3-C2 (Stock inox)</SelectItem>
                  <SelectItem value="C1-A1-B3">📍 C1-A1-B3 (Consommables)</SelectItem>
                  <SelectItem value="D1-A2-B1">📍 D1-A2-B1 (Entrepôt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>
          </div>

          {/* ✅ Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={Object.keys(errors).some(key => errors[key])}
            >
              Ajouter le matériau
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ✅ BONUS: Version simple pour compatibilité
export function AddMaterialDialogSimple({ open, onOpenChange }: AddMaterialDialogProps) {
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    quantite: '',
    prixUnitaire: '',
    emplacement: '',
    seuil: '',
  })

  // ✅ Handler simplifié
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Matériau ajouté:', formData)
    onOpenChange(false)
    setFormData({
      reference: '',
      designation: '',
      quantite: '',
      prixUnitaire: '',
      emplacement: '',
      seuil: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un matériau
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference">Référence *</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={handleInputChange('reference')}
                placeholder="REF-001"
              />
            </div>
            <div>
              <Label htmlFor="quantite">Quantité *</Label>
              <Input
                id="quantite"
                type="number"
                min="0" 
                value={formData.quantite}
                onChange={handleInputChange('quantite')}
                placeholder="100"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="designation">Désignation *</Label>
            <Input
              id="designation"
              value={formData.designation}
              onChange={handleInputChange('designation')}
              placeholder="Acier S235 - Tôle 2mm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prixUnitaire">Prix unitaire</Label>
              <Input
                id="prixUnitaire"
                type="number"
                min="0" 
                value={formData.prixUnitaire}
                onChange={handleInputChange('prixUnitaire')}
                placeholder="12.50"
              />
            </div>
            <div>
              <Label htmlFor="seuil">Seuil d'alerte</Label>
              <Input
                id="seuil"
                type="number"
                min="0"
                value={formData.seuil}
                onChange={handleInputChange('seuil')}
                placeholder="10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="emplacement">Emplacement</Label>
            <Input
              id="emplacement"
              value={formData.emplacement}
              onChange={handleInputChange('emplacement')}
              placeholder="A1-B2-C3"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}