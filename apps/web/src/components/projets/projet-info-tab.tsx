'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Projet } from '@/types'
import { ProjetStatut } from '@erp/types'
import {
  Building2,
  Calendar,
  Clock,
  Edit,
  Euro,
  Mail,
  MapPin,
  Phone,
  Save,
  X
} from 'lucide-react'
import { useState } from 'react'

interface ProjetInfoTabProps {
  projet: Projet
}

export function ProjetInfoTab({ projet }: ProjetInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    reference: projet.reference || '',
    description: projet.description || '',
    dateDebut: projet.dateDebut ? new Date(projet.dateDebut).toISOString().split('T')[0] : '',
    dateFin: projet.dateFin ? new Date(projet.dateFin).toISOString().split('T')[0] : '',
  })

  const handleSave = () => {
    // Ici, on sauvegarderait les modifications
    console.log('Sauvegarde des modifications:', formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Réinitialiser le formulaire
    setFormData({
      reference: projet.reference || '',
      description: projet.description || '',
      dateDebut: projet.dateDebut ? new Date(projet.dateDebut).toISOString().split('T')[0] : '',
      dateFin: projet.dateFin ? new Date(projet.dateFin).toISOString().split('T')[0] : '',
    })
    setIsEditing(false)
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
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
              <Label>Nom du projet</Label>
              {isEditing ? (
                <Input 
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="mt-1" 
                />
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
            <Label>Description</Label>
            {isEditing ? (
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1"
                rows={3}
                placeholder="Description du projet..."
              />
            ) : (
              <p className="text-sm mt-1 text-muted-foreground">
                {projet.description || 'Aucune description disponible'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début</Label>
              {isEditing ? (
                <Input 
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => setFormData({...formData, dateDebut: e.target.value})}
                  className="mt-1" 
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {projet.dateDebut ? formatDate(new Date(projet.dateDebut)) : 'Non définie'}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label>Date de fin prévue</Label>
              {isEditing ? (
                <Input 
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                  className="mt-1" 
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {projet.dateFin ? formatDate(new Date(projet.dateFin)) : 'Non définie'}
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
                      <div>{projet.client.adresse.codePostal} {projet.client.adresse.ville}</div>
                    )}
                  </div>
                ) : (
                  <div>
                    123 Rue de l'Industrie<br />
                    44800 Saint-Herblain
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{projet.client?.telephone || '02 40 XX XX XX'}</p>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{projet.client?.email || 'contact@client.fr'}</p>
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

          {/* Progression financière */}
          {(projet as any).montantPaye && projet.montantTTC && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progression des paiements</span>
                <span>{Math.round(((projet as any).montantPaye / projet.montantTTC) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(((projet as any).montantPaye / projet.montantTTC) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Payé: {formatCurrency((projet as any).montantPaye)}</span>
                <span>Restant: {formatCurrency(projet.montantTTC - (projet as any).montantPaye)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}