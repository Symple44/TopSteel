'use client'

import { useState } from 'react'
import { PROJET_STATUT } from '@erp/types'
import { 
  Building2, 
  Calendar, 
  Euro, 
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Projet } from '@/types'

interface ProjetInfoTabProps {
  projet: Projet
}

export function ProjetInfoTab({ projet }: ProjetInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom du projet</Label>
              {isEditing ? (
                <Input defaultValue={projet.reference} className="mt-1" />
              ) : (
                <p className="text-sm font-medium mt-1">{projet.reference}</p>
              )}
            </div>
            <div>
              <Label>Statut</Label>
              <div className="mt-1">
                <Badge variant={projet.statut === PROJET_STATUT.EN_COURS ? 'default' : 'secondary'}>
                  {projet.statut?.replace('_', ' ') || 'Nouveau'}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            {isEditing ? (
              <Textarea defaultValue={projet.description} className="mt-1" />
            ) : (
              <p className="text-sm text-muted-foreground mt-1">{projet.description}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Date de création</Label>
              <p className="text-sm font-medium">
                {projet.dateCreation ? formatDate(projet.dateCreation) : 'Non définie'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Échéance prévue</Label>
              <p className="text-sm font-medium">
                {projet.dateEcheance ? formatDate(projet.dateEcheance) : 'Non définie'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Responsable</Label>
              <p className="text-sm font-medium">John Doe</p>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={() => setIsEditing(false)}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
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
                123 Rue de l'Industrie<br />
                44800 Saint-Herblain
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">02 40 XX XX XX</p>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">contact@client.fr</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations financières */}
      <Card>
        <CardHeader>
          <CardTitle>Informations financières</CardTitle>
          <CardDescription>Montants et détails financiers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Montant HT</div>
              <p className="text-lg font-semibold">{formatCurrency(projet.montantHT)}</p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">TVA (20%)</div>
              <p className="text-lg font-semibold">
                {formatCurrency(projet.montantTTC - projet.montantHT)}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm text-muted-foreground mb-1">Montant TTC</div>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(projet.montantTTC)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


