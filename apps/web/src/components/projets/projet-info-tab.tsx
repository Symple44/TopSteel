'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Projet } from '@/types'
import { 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Euro,
  TrendingUp
} from 'lucide-react'

interface ProjetInfoTabProps {
  projet: Projet
}

export function ProjetInfoTab({ projet }: ProjetInfoTabProps) {
  // Données mockées pour la timeline
  const timeline = [
    {
      id: 1,
      date: new Date('2025-06-15'),
      title: 'Création du projet',
      description: 'Projet créé suite à la demande client',
      user: 'Jean Dupont',
      type: 'creation',
    },
    {
      id: 2,
      date: new Date('2025-06-16'),
      title: 'Devis envoyé',
      description: 'Devis n°DEV-2025-0142 envoyé au client',
      user: 'Marie Martin',
      type: 'devis',
    },
    {
      id: 3,
      date: new Date('2025-06-18'),
      title: 'Devis accepté',
      description: 'Le client a accepté le devis',
      user: 'Système',
      type: 'validation',
    },
    {
      id: 4,
      date: new Date('2025-06-20'),
      title: 'Début de production',
      description: 'Lancement de la fabrication',
      user: 'Pierre Durand',
      type: 'production',
    },
  ]

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'creation':
        return <FileText className="h-4 w-4" />
      case 'devis':
        return <Euro className="h-4 w-4" />
      case 'validation':
        return <TrendingUp className="h-4 w-4" />
      case 'production':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Informations projet */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
          <CardDescription>Détails généraux du projet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <FileText className="mr-2 h-4 w-4" />
              Référence
            </div>
            <p className="font-medium">{projet.reference}</p>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <FileText className="mr-2 h-4 w-4" />
              Description
            </div>
            <p className="text-sm">{projet.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Calendar className="mr-2 h-4 w-4" />
                Date de création
              </div>
              <p className="text-sm font-medium">{formatDate(projet.dateCreation)}</p>
            </div>
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Calendar className="mr-2 h-4 w-4" />
                Date de début
              </div>
              <p className="text-sm font-medium">
                {projet.dateDebut ? formatDate(projet.dateDebut) : 'Non définie'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Calendar className="mr-2 h-4 w-4" />
                Date de fin prévue
              </div>
              <p className="text-sm font-medium">
                {projet.dateFin ? formatDate(projet.dateFin) : 'Non définie'}
              </p>
            </div>
            <div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <Clock className="mr-2 h-4 w-4" />
                Durée estimée
              </div>
              <p className="text-sm font-medium">
                {projet.dateDebut && projet.dateFin
                  ? `${Math.ceil(
                      (projet.dateFin.getTime() - projet.dateDebut.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} jours`
                  : 'Non définie'}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avancement global</span>
              <span className="text-sm font-medium">{projet.avancement}%</span>
            </div>
            <Progress value={projet.avancement} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
          <CardDescription>Coordonnées et détails du client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Building2 className="mr-2 h-4 w-4" />
              Nom
            </div>
            <p className="font-medium">{projet.client.nom}</p>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </div>
            <p className="text-sm">{projet.client.email}</p>
          </div>

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <Phone className="mr-2 h-4 w-4" />
              Téléphone
            </div>
            <p className="text-sm">{projet.client.telephone || '02 40 XX XX XX'}</p>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-1">
              <MapPin className="mr-2 h-4 w-4" />
              Adresse
            </div>
            <p className="text-sm">
              {projet.client.adresse ? (
                <>
                  {projet.client.adresse.rue}<br />
                  {projet.client.adresse.codePostal} {projet.client.adresse.ville}
                </>
              ) : (
                '123 Rue de l\'Industrie<br />44800 Saint-Herblain'
              )}
            </p>
          </div>

          {projet.client.siret && (
            <>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground mb-1">SIRET</div>
                <p className="text-sm font-mono">{projet.client.siret}</p>
              </div>
            </>
          )}
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

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Acompte versé</span>
              <span className="font-medium">30%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant acompte</span>
              <span className="font-medium">{formatCurrency(projet.montantTTC * 0.3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reste à payer</span>
              <span className="font-medium">{formatCurrency(projet.montantTTC * 0.7)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline du projet */}
      <Card>
        <CardHeader>
          <CardTitle>Historique du projet</CardTitle>
          <CardDescription>Chronologie des événements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {getTimelineIcon(event.type)}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="absolute top-10 h-full w-px bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold">{event.title}</h4>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(event.date, 'time')}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Par {event.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}