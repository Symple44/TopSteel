'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Calendar,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateProjet } from '@/hooks/use-projets'
import { ClientType } from '@/types'

const projetSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  typeProjet: z.string().min(1, 'Le type de projet est requis'),
  adresseChantier: z.object({
    rue: z.string().min(1, 'La rue est requise'),
    codePostal: z.string().regex(/^\d{5}$/, 'Code postal invalide'),
    ville: z.string().min(1, 'La ville est requise'),
  }),
}).refine((data) => {
  if (data.dateDebut && data.dateFin) {
    return new Date(data.dateDebut) <= new Date(data.dateFin)
  }
  return true
}, {
  message: "La date de fin doit être après la date de début",
  path: ["dateFin"],
})

type ProjetFormData = z.infer<typeof projetSchema>

// Données mockées pour les clients
const mockClients = [
  { id: '1', nom: 'Entreprise ABC', type: ClientType.PROFESSIONNEL },
  { id: '2', nom: 'Société XYZ', type: ClientType.PROFESSIONNEL },
  { id: '3', nom: 'SARL Martin', type: ClientType.PROFESSIONNEL },
  { id: '4', nom: 'Mairie de Saint-Herblain', type: ClientType.COLLECTIVITE },
  { id: '5', nom: 'Jean Dupont', type: ClientType.PARTICULIER },
]

export default function NouveauProjetPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createProjet = useCreateProjet()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjetFormData>({
    resolver: zodResolver(projetSchema),
    defaultValues: {
      adresseChantier: {
        rue: '',
        codePostal: '',
        ville: '',
      },
    },
  })

  const selectedClientId = watch('clientId')

  const onSubmit = async (data: ProjetFormData) => {
    setIsSubmitting(true)
    try {
      // Ici, appeler l'API pour créer le projet
      // await createProjet.mutateAsync(data)
      
      // Simulation
      setTimeout(() => {
        router.push('/projets')
      }, 1000)
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/projets')}
          className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux projets
        </button>
        
        <h1 className="text-3xl font-bold tracking-tight">Nouveau projet</h1>
        <p className="text-muted-foreground mt-2">
          Créez un nouveau projet de métallerie
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Renseignez les informations de base du projet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={(value) => setValue('clientId', value)}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {client.nom}
                          {client.type === ClientType.PARTICULIER && ' (Particulier)'}
                          {client.type === ClientType.COLLECTIVITE && ' (Collectivité)'}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-sm text-red-600">{errors.clientId.message}</p>
                )}
                <Button variant="link" className="px-0 h-auto text-sm">
                  <Plus className="mr-1 h-3 w-3" />
                  Créer un nouveau client
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeProjet">Type de projet *</Label>
                <Select
                  value={watch('typeProjet')}
                  onValueChange={(value) => setValue('typeProjet', value)}
                >
                  <SelectTrigger id="typeProjet">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="garde-corps">Garde-corps</SelectItem>
                    <SelectItem value="escalier">Escalier métallique</SelectItem>
                    <SelectItem value="structure">Structure métallique</SelectItem>
                    <SelectItem value="portail">Portail / Clôture</SelectItem>
                    <SelectItem value="verriere">Verrière</SelectItem>
                    <SelectItem value="passerelle">Passerelle</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {errors.typeProjet && (
                  <p className="text-sm text-red-600">{errors.typeProjet.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description du projet *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Décrivez le projet en détail..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Planning */}
        <Card>
          <CardHeader>
            <CardTitle>Planning prévisionnel</CardTitle>
            <CardDescription>
              Définissez les dates de début et de fin du projet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateDebut">
                  <Calendar className="inline-block h-4 w-4 mr-2" />
                  Date de début
                </Label>
                <Input
                  id="dateDebut"
                  type="date"
                  {...register('dateDebut')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFin">
                  <Calendar className="inline-block h-4 w-4 mr-2" />
                  Date de fin prévisionnelle
                </Label>
                <Input
                  id="dateFin"
                  type="date"
                  {...register('dateFin')}
                />
                {errors.dateFin && (
                  <p className="text-sm text-red-600">{errors.dateFin.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adresse du chantier */}
        <Card>
          <CardHeader>
            <CardTitle>Adresse du chantier</CardTitle>
            <CardDescription>
              Lieu de réalisation des travaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rue">Rue *</Label>
                <Input
                  id="rue"
                  {...register('adresseChantier.rue')}
                  placeholder="123 Rue de l'Exemple"
                />
                {errors.adresseChantier?.rue && (
                  <p className="text-sm text-red-600">{errors.adresseChantier.rue.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="codePostal">Code postal *</Label>
                  <Input
                    id="codePostal"
                    {...register('adresseChantier.codePostal')}
                    placeholder="44800"
                    maxLength={5}
                  />
                  {errors.adresseChantier?.codePostal && (
                    <p className="text-sm text-red-600">{errors.adresseChantier.codePostal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ville">Ville *</Label>
                  <Input
                    id="ville"
                    {...register('adresseChantier.ville')}
                    placeholder="Saint-Herblain"
                  />
                  {errors.adresseChantier?.ville && (
                    <p className="text-sm text-red-600">{errors.adresseChantier.ville.message}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Une fois le projet créé, vous pourrez ajouter des devis, des documents et suivre l'avancement de la production.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/projets')}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Créer le projet
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}