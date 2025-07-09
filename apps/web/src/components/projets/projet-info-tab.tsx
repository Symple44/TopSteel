'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import type { Projet } from '@/types'
import { ProjetStatut } from '@erp/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Textarea
} from '@erp/ui'

import { Building2, Calendar, Clock, Edit, Euro, Mail, MapPin, Phone, Save, X } from 'lucide-react'
import { useState } from 'react'

interface ProjetInfoTabProps {
  projet: Projet
  onUpdate?: (updatedProjet: Partial<Projet>) => void
}

// ✅ Interface pour le formulaire d'édition
interface FormData {
  reference: string
  description: string
  dateDebut: string
  dateFin: string
}

export function ProjetInfoTab({ projet, onUpdate }: ProjetInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // ✅ Fonction helper pour convertir les dates
  const dateToInputValue = (date: Date | undefined): string => {
    if (!date) return ''
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<FormData>({
    reference: projet.reference || '',
    description: projet.description || '',
    dateDebut: dateToInputValue(projet.dateDebut),
    dateFin: dateToInputValue(projet.dateFin),
  })

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

  // ✅ Validation des données
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validation reference
    if (!formData.reference.trim()) {
      newErrors.reference = 'Le nom du projet est requis'
    }

    // Validation description
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise'
    } else if (formData.description.length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères'
    }

    // Validation des dates
    if (formData.dateDebut && formData.dateFin) {
      const debut = new Date(formData.dateDebut)
      const fin = new Date(formData.dateFin)
      
      if (debut >= fin) {
        newErrors.dateFin = 'La date de fin doit être postérieure à la date de début'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ Sauvegarde avec validation
  const handleSave = () => {
    if (!validateForm()) {
      return
    }

    const updatedData: Partial<Projet> = {
      reference: formData.reference,
      description: formData.description,
      dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : undefined,
      dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
    }

    console.log('Sauvegarde des modifications:', updatedData)
    onUpdate?.(updatedData)
    setIsEditing(false)
    setErrors({})
  }

  // ✅ Annulation avec reset
  const handleCancel = () => {
    setFormData({
      reference: projet.reference || '',
      description: projet.description || '',
      dateDebut: dateToInputValue(projet.dateDebut),
      dateFin: dateToInputValue(projet.dateFin),
    })
    setErrors({})
    setIsEditing(false)
  }

  // ✅ Helper pour les classes d'erreur
  const getInputClassName = (field: string) => {
    return errors[field] ? 'border-red-500' : ''
  }

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Détails du projet et paramètres</CardDescription>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference">Nom du projet</Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={handleInputChange('reference')}
                    className={`mt-1 ${getInputClassName('reference')}`}
                    placeholder="Nom du projet..."
                  />
                  {errors.reference && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠️</span>
                      {errors.reference}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm font-medium mt-1">{projet.reference || 'Non défini'}</p>
              )}
            </div>
            <div>
              <Label>Statut</Label>
              <div className="mt-1">
                <Badge variant={projet.statut === ProjetStatut.EN_COURS ? 'default' : 'secondary'}>
                  {projet.statut?.replace('_', ' ') || 'Nouveau'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <div className="space-y-1">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange('description')} 
                  className={`mt-1 ${getInputClassName('description')}`}
                  rows={3}
                  placeholder="Description détaillée du projet..."
                />
                {errors.description && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span>
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 caractères
                </p>
              </div>
            ) : (
              <p className="text-sm mt-1 text-muted-foreground">
                {projet.description || 'Aucune description disponible'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut">Date de début</Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={handleInputChange('dateDebut')}
                    className={`mt-1 ${getInputClassName('dateDebut')}`}
                  />
                  {errors.dateDebut && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠️</span>
                      {errors.dateDebut}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {projet.dateDebut ? formatDate(projet.dateDebut) : 'Non définie'}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="dateFin">Date de fin prévue</Label>
              {isEditing ? (
                <div className="space-y-1">
                  <Input
                    id="dateFin"
                    type="date"
                    value={formData.dateFin}
                    onChange={handleInputChange('dateFin')}
                    className={`mt-1 ${getInputClassName('dateFin')}`}
                  />
                  {errors.dateFin && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>⚠️</span>
                      {errors.dateFin}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {projet.dateFin ? formatDate(projet.dateFin) : 'Non définie'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations client
          </CardTitle>
          <CardDescription>Détails du client et contact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{projet.client?.nom || 'Client non défini'}</p>
              <p className="text-sm text-muted-foreground">Entreprise</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                {projet.client?.adresse ? (
                  <div>
                    {projet.client.adresse.rue && <div>{projet.client.adresse.rue}</div>}
                    {projet.client.adresse.ville && projet.client.adresse.codePostal && (
                      <div>
                        {projet.client.adresse.codePostal} {projet.client.adresse.ville}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Adresse non renseignée
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                {projet.client?.telephone || (
                  <span className="text-muted-foreground">Téléphone non renseigné</span>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">
                {projet.client?.email || (
                  <span className="text-muted-foreground">Email non renseigné</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations financières */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Informations financières
          </CardTitle>
          <CardDescription>Montants et détails financiers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Montant HT</div>
              <p className="text-lg font-semibold">{formatCurrency(projet.montantHT || 0)}</p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">TVA (20%)</div>
              <p className="text-lg font-semibold">
                {formatCurrency((projet.montantTTC || 0) - (projet.montantHT || 0))}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm text-muted-foreground mb-1">Montant TTC</div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(projet.montantTTC || 0)}
            </p>
          </div>

          {/* ✅ Progression financière améliorée */}
          {(projet as any).montantPaye && projet.montantTTC && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progression des paiements</span>
                <span className="font-semibold">
                  {Math.round(((projet as any).montantPaye / projet.montantTTC) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: `${Math.min(((projet as any).montantPaye / projet.montantTTC) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  <span className="font-medium">Payé:</span> {formatCurrency((projet as any).montantPaye)}
                </span>
                <span>
                  <span className="font-medium">Restant:</span> {formatCurrency(projet.montantTTC - (projet as any).montantPaye)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}