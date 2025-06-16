// packages/ui/src/components/forms/projet-form.tsx
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../base/button'
import { Input } from '../base/input'
import { Label } from '../base/label'
import { Textarea } from '../base/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select'
import { Card, CardContent, CardHeader, CardTitle } from '../base/card'
import { Alert, AlertDescription } from '../base/alert'
import { projetSchema } from '@erp/utils'
import type { ProjetFormData, Client, ProjetType, ProjetPriorite } from '@erp/types'

interface ProjetFormProps {
  clients: Client[]
  initialData?: Partial<ProjetFormData>
  onSubmit: (data: ProjetFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

export function ProjetForm({ 
  clients, 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  className 
}: ProjetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProjetFormData>({
    resolver: zodResolver(projetSchema),
    defaultValues: initialData
  })

  const handleFormSubmit = async (data: ProjetFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Modifier le projet' : 'Nouveau projet'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Sélection du client */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select onValueChange={(value) => setValue('clientId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom} ({client.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-red-600">{errors.clientId.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description détaillée du projet"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Type et priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de projet *</Label>
              <Select onValueChange={(value: ProjetType) => setValue('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PORTAIL">Portail</SelectItem>
                  <SelectItem value="CLOTURE">Clôture</SelectItem>
                  <SelectItem value="ESCALIER">Escalier</SelectItem>
                  <SelectItem value="RAMPE">Rampe</SelectItem>
                  <SelectItem value="VERRIERE">Verrière</SelectItem>
                  <SelectItem value="STRUCTURE">Structure</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Priorité *</Label>
              <Select onValueChange={(value: ProjetPriorite) => setValue('priorite', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASSE">Basse</SelectItem>
                  <SelectItem value="NORMALE">Normale</SelectItem>
                  <SelectItem value="HAUTE">Haute</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
              {errors.priorite && (
                <p className="text-sm text-red-600">{errors.priorite.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                {...register('dateDebut')}
              />
              {errors.dateDebut && (
                <p className="text-sm text-red-600">{errors.dateDebut.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin prévue</Label>
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

          {/* Adresse du chantier */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Adresse du chantier</Label>
            
            <div className="space-y-2">
              <Label htmlFor="adresse.rue">Rue *</Label>
              <Input
                id="adresse.rue"
                {...register('adresseChantier.rue')}
                placeholder="Numéro et nom de rue"
              />
              {errors.adresseChantier?.rue && (
                <p className="text-sm text-red-600">{errors.adresseChantier.rue.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adresse.codePostal">Code postal *</Label>
                <Input
                  id="adresse.codePostal"
                  {...register('adresseChantier.codePostal')}
                  placeholder="44000"
                />
                {errors.adresseChantier?.codePostal && (
                  <p className="text-sm text-red-600">{errors.adresseChantier.codePostal.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse.ville">Ville *</Label>
                <Input
                  id="adresse.ville"
                  {...register('adresseChantier.ville')}
                  placeholder="Nantes"
                />
                {errors.adresseChantier?.ville && (
                  <p className="text-sm text-red-600">{errors.adresseChantier.ville.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Notes supplémentaires"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}