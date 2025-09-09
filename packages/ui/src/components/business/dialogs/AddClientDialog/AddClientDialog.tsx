'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms/form/form'
import { Card, CardHeader, CardTitle } from '../../../layout/card'
import { ScrollArea } from '../../../layout/scroll-area/ScrollArea'
import { Button } from '../../../primitives/button/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
import { Switch } from '../../../primitives/switch/switch'
import { Textarea } from '../../../primitives/textarea/Textarea'

// Client validation schema
const clientSchema = z.object({
  // Company Information
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  siret: z.string().optional(),
  tvaNumber: z.string().optional(),
  companyType: z.enum(['SARL', 'SAS', 'SA', 'EI', 'EURL', 'SCI', 'Autre'] as const),
  // Contact Information
  contactFirstName: z.string().min(1, 'Le prénom du contact est requis'),
  contactLastName: z.string().min(1, 'Le nom du contact est requis'),
  contactEmail: z.string().email('Email invalide').min(1, "L'email est requis"),
  contactPhone: z.string().min(1, 'Le téléphone est requis'),
  contactPosition: z.string().optional(),
  // Address Information
  address: z.string().min(1, "L'adresse est requise"),
  postalCode: z.string().min(1, 'Le code postal est requis'),
  city: z.string().min(1, 'La ville est requise'),
  country: z.string().default('France'),
  // Billing Information
  billingAddress: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCity: z.string().optional(),
  billingCountry: z.string().optional(),
  useSameAddress: z.boolean().default(true),
  paymentTerms: z.enum(['immediate', '15days', '30days', '45days', '60days']).default('30days'),
  paymentMethod: z.enum(['transfer', 'check', 'card', 'cash']).default('transfer'),
  // Credit Information
  creditLimit: z.number().min(0, 'La limite de crédit doit être positive').default(0),
  creditUsed: z.number().min(0, 'Le crédit utilisé doit être positif').default(0),
  // Business Information
  sector: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  preferredLanguage: z.enum(['fr', 'en']).default('fr'),
})
type ClientFormData = z.infer<typeof clientSchema>
interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: ClientFormData) => void | Promise<void>
}
export function AddClientDialog({ open, onOpenChange, onSubmit }: AddClientDialogProps) {
  const dialogTitleId = useId()
  const dialogDescriptionId = useId()
  const companyInfoSectionId = useId()
  const contactInfoSectionId = useId()
  const addressInfoSectionId = useId()
  const billingInfoSectionId = useId()
  const sameAddressHelpId = useId()
  const creditInfoSectionId = useId()
  const additionalInfoSectionId = useId()
  const activeClientHelpId = useId()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      companyName: '',
      siret: '',
      tvaNumber: '',
      companyType: 'SARL',
      contactFirstName: '',
      contactLastName: '',
      contactEmail: '',
      contactPhone: '',
      contactPosition: '',
      address: '',
      postalCode: '',
      city: '',
      country: 'France',
      billingAddress: '',
      billingPostalCode: '',
      billingCity: '',
      billingCountry: '',
      useSameAddress: true,
      paymentTerms: '30days',
      paymentMethod: 'transfer',
      creditLimit: 0,
      creditUsed: 0,
      sector: '',
      notes: '',
      isActive: true,
      preferredLanguage: 'fr',
    },
  })
  const watchUseSameAddress = form.watch('useSameAddress')
  const handleSubmit = async (data: ClientFormData) => {
    try {
      setLoading(true)
      setError(null)
      // If using same address, copy main address to billing
      if (data.useSameAddress) {
        data.billingAddress = data.address
        data.billingPostalCode = data.postalCode
        data.billingCity = data.city
        data.billingCountry = data.country
      }
      await onSubmit?.(data)
      form.reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    form.reset()
    setError(null)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh]"
        role="dialog"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
      >
        <DialogHeader>
          <DialogTitle id={dialogTitleId}>Ajouter un nouveau client</DialogTitle>
          <p id={dialogDescriptionId} className="sr-only">
            Formulaire pour créer un nouveau client avec ses informations d'entreprise, de contact,
            d'adresse et de facturation
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit as any)}
              className="space-y-6"
              noValidate
              aria-label="Formulaire d'ajout de client"
            >
              {error && (
                <div
                  className="rounded-md bg-red-50 p-4 border border-red-200"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" id={companyInfoSectionId}>
                    Informations de l'entreprise
                  </CardTitle>
                </CardHeader>
                <fieldset className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nom de l'entreprise *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de l'entreprise" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'entreprise</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SARL">SARL</SelectItem>
                            <SelectItem value="SAS">SAS</SelectItem>
                            <SelectItem value="SA">SA</SelectItem>
                            <SelectItem value="EI">EI</SelectItem>
                            <SelectItem value="EURL">EURL</SelectItem>
                            <SelectItem value="SCI">SCI</SelectItem>
                            <SelectItem value="Autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="siret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SIRET</FormLabel>
                        <FormControl>
                          <Input placeholder="123 456 789 01234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="tvaNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de TVA</FormLabel>
                        <FormControl>
                          <Input placeholder="FR12345678901" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secteur d'activité</FormLabel>
                        <FormControl>
                          <Input placeholder="Construction, Industrie..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
              </Card>
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" id={contactInfoSectionId}>
                    Contact principal
                  </CardTitle>
                </CardHeader>
                <fieldset className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="contactFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="contactLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@entreprise.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone *</FormLabel>
                        <FormControl>
                          <Input placeholder="01 23 45 67 89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="contactPosition"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Fonction</FormLabel>
                        <FormControl>
                          <Input placeholder="Directeur, Chef de projet..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
              </Card>
              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" id={addressInfoSectionId}>
                    Adresse de l'entreprise
                  </CardTitle>
                </CardHeader>
                <fieldset className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control as any}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>Adresse *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Rue de la Paix" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal *</FormLabel>
                        <FormControl>
                          <Input placeholder="75001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input placeholder="France" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
              </Card>
              {/* Billing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" id={billingInfoSectionId}>
                    Informations de facturation
                  </CardTitle>
                </CardHeader>
                <fieldset className="space-y-4">
                  <FormField
                    control={form.control as any}
                    name="useSameAddress"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-describedby="same-address-help"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Utiliser la même adresse que l'entreprise
                        </FormLabel>
                        <p id={sameAddressHelpId} className="sr-only">
                          Si activé, les champs d'adresse de facturation seront automatiquement
                          remplis avec l'adresse de l'entreprise
                        </p>
                      </FormItem>
                    )}
                  />
                  {!watchUseSameAddress && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control as any}
                        name="billingAddress"
                        render={({ field }) => (
                          <FormItem className="md:col-span-3">
                            <FormLabel>Adresse de facturation</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Adresse de facturation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="billingPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal</FormLabel>
                            <FormControl>
                              <Input placeholder="75001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="billingCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input placeholder="Paris" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="billingCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays</FormLabel>
                            <FormControl>
                              <Input placeholder="France" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conditions de paiement</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Conditions de paiement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">Immédiat</SelectItem>
                              <SelectItem value="15days">15 jours</SelectItem>
                              <SelectItem value="30days">30 jours</SelectItem>
                              <SelectItem value="45days">45 jours</SelectItem>
                              <SelectItem value="60days">60 jours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode de paiement préféré</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Mode de paiement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="transfer">Virement</SelectItem>
                              <SelectItem value="check">Chèque</SelectItem>
                              <SelectItem value="card">Carte bancaire</SelectItem>
                              <SelectItem value="cash">Espèces</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </fieldset>
              </Card>
              {/* Credit Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" id={creditInfoSectionId}>
                    Gestion du crédit
                  </CardTitle>
                </CardHeader>
                <fieldset className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite de crédit (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="creditUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crédit utilisé (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
              </Card>
              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" id={additionalInfoSectionId}>
                    Informations complémentaires
                  </CardTitle>
                </CardHeader>
                <fieldset className="space-y-4">
                  <FormField
                    control={form.control as any}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Langue préférée</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="max-w-xs">
                              <SelectValue placeholder="Langue" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires sur le client..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-describedby={activeClientHelpId}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Client actif</FormLabel>
                        <p id={activeClientHelpId} className="sr-only">
                          Indique si le client est actif et peut passer des commandes
                        </p>
                      </FormItem>
                    )}
                  />
                </fieldset>
              </Card>
              <fieldset className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                  aria-label="Annuler la création du client et fermer le dialog"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                  aria-label={
                    loading
                      ? 'Création en cours, veuillez patienter'
                      : 'Créer le nouveau client avec les informations saisies'
                  }
                >
                  {loading ? 'Création en cours...' : 'Créer le client'}
                </Button>
              </fieldset>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
