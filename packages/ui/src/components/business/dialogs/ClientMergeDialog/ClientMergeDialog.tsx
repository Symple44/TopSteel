'use client'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Building, 
  Users, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle,
  Mail,
  Phone,
  MapPin,
  Credit,
  FileText,
} from 'lucide-react'
import { Button } from '../../../primitives/button/Button'
import { DialogTrigger } from '../../../primitives/dialog/Dialog'
import { FormMessage } from '../../../forms/form/form'
import { CardFooter } from '../../../layout/card'
import { SelectValue } from '../../../primitives/select/select'
import { Textarea } from '../../../primitives/textarea/Textarea'
import { Badge } from '../../../data-display/badge'
import { ScrollArea } from '../../../layout/scroll-area/ScrollArea'
import {
  Alert,
  RadioGroup,
  RadioGroupItem,
  Label,
  Avatar,
  AvatarFallback,
  Separator,
} from '../../../'
// Extended client interface for merge operations
export interface MergeableClient {
  id: string
  companyName: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string
  contactPosition?: string
  address: string
  city: string
  postalCode: string
  country: string
  sector?: string
  companyType: 'SARL' | 'SAS' | 'SA' | 'EI' | 'EURL' | 'SCI' | 'Autre'
  siret?: string
  tvaNumber?: string
  isActive: boolean
  creditLimit: number
  creditUsed: number
  paymentTerms: 'immediate' | '15days' | '30days' | '45days' | '60days'
  paymentMethod: 'transfer' | 'check' | 'card' | 'cash'
  notes?: string
  createdAt: Date
  updatedAt: Date
  // Merge-specific data
  totalOrders: number
  totalRevenue: number
  lastOrderDate?: Date
  openInvoices: number
  unpaidAmount: number
}
// Merge configuration schema
const mergeSchema = z.object({
  primaryClientId: z.string().min(1, 'Vous devez sélectionner un client principal'),
  secondaryClientId: z.string().min(1, 'Vous devez sélectionner un client à fusionner'),
  mergeStrategy: z.object({
    companyName: z.enum(['primary', 'secondary', 'manual']).default('primary'),
    contactInfo: z.enum(['primary', 'secondary', 'manual']).default('primary'),
    address: z.enum(['primary', 'secondary', 'manual']).default('primary'),
    billing: z.enum(['primary', 'secondary', 'combine']).default('combine'),
    notes: z.enum(['primary', 'secondary', 'combine']).default('combine'),
  }),
  customValues: z.object({
    companyName: z.string().optional(),
    contactFirstName: z.string().optional(),
    contactLastName: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  mergeNotes: z.string().min(1, 'Veuillez indiquer la raison de cette fusion'),
  confirmDeletion: z.boolean().refine(val => val === true, {
    message: 'Vous devez confirmer la suppression du client secondaire'
  }),
})
type MergeFormData = z.infer<typeof mergeSchema>
interface ClientMergeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (mergeConfig: MergeFormData & { 
    primaryClient: MergeableClient
    secondaryClient: MergeableClient
  }) => void | Promise<void>
  clients?: MergeableClient[]
  preselectedClients?: [string, string] // [primary, secondary]
}
export function ClientMergeDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  clients = [],
  preselectedClients 
}: ClientMergeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'selection' | 'configuration' | 'preview'>('selection')
  const form = useForm<MergeFormData>({
    resolver: zodResolver(mergeSchema),
    defaultValues: {
      primaryClientId: preselectedClients?.[0] || '',
      secondaryClientId: preselectedClients?.[1] || '',
      mergeStrategy: {
        companyName: 'primary',
        contactInfo: 'primary',
        address: 'primary',
        billing: 'combine',
        notes: 'combine',
      },
      confirmDeletion: false,
    },
  })
  const watchPrimaryId = form.watch('primaryClientId')
  const watchSecondaryId = form.watch('secondaryClientId')
  const watchMergeStrategy = form.watch('mergeStrategy')
  const primaryClient = useMemo(() => 
    clients.find(c => c.id === watchPrimaryId), 
    [clients, watchPrimaryId]
  )
  const secondaryClient = useMemo(() => 
    clients.find(c => c.id === watchSecondaryId), 
    [clients, watchSecondaryId]
  )
  // Generate preview of merged client
  const mergedPreview = useMemo(() => {
    if (!primaryClient || !secondaryClient) return null
    const strategy = watchMergeStrategy
    const customValues = form.getValues('customValues') || {}
    return {
      companyName: strategy.companyName === 'manual' ? customValues.companyName || primaryClient.companyName :
                  strategy.companyName === 'primary' ? primaryClient.companyName : secondaryClient.companyName,
      contactFirstName: strategy.contactInfo === 'manual' ? customValues.contactFirstName || primaryClient.contactFirstName :
                       strategy.contactInfo === 'primary' ? primaryClient.contactFirstName : secondaryClient.contactFirstName,
      contactLastName: strategy.contactInfo === 'manual' ? customValues.contactLastName || primaryClient.contactLastName :
                      strategy.contactInfo === 'primary' ? primaryClient.contactLastName : secondaryClient.contactLastName,
      contactEmail: strategy.contactInfo === 'manual' ? customValues.contactEmail || primaryClient.contactEmail :
                   strategy.contactInfo === 'primary' ? primaryClient.contactEmail : secondaryClient.contactEmail,
      contactPhone: strategy.contactInfo === 'manual' ? customValues.contactPhone || primaryClient.contactPhone :
                   strategy.contactInfo === 'primary' ? primaryClient.contactPhone : secondaryClient.contactPhone,
      address: strategy.address === 'primary' ? primaryClient.address : secondaryClient.address,
      city: strategy.address === 'primary' ? primaryClient.city : secondaryClient.city,
      creditLimit: Math.max(primaryClient.creditLimit, secondaryClient.creditLimit),
      creditUsed: primaryClient.creditUsed + secondaryClient.creditUsed,
      totalOrders: primaryClient.totalOrders + secondaryClient.totalOrders,
      totalRevenue: primaryClient.totalRevenue + secondaryClient.totalRevenue,
      unpaidAmount: primaryClient.unpaidAmount + secondaryClient.unpaidAmount,
      notes: strategy.notes === 'combine' ? 
        `${primaryClient.notes || ''}\n\n--- Fusion avec ${secondaryClient.companyName} ---\n${secondaryClient.notes || ''}`.trim() :
        strategy.notes === 'primary' ? primaryClient.notes : secondaryClient.notes,
    }
  }, [primaryClient, secondaryClient, watchMergeStrategy, form])
  const handleSubmit = async (data: MergeFormData) => {
    if (!primaryClient || !secondaryClient) return
    try {
      setLoading(true)
      setError(null)
      await onSubmit?.({
        ...data,
        primaryClient,
        secondaryClient,
      })
      onOpenChange(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
  const resetForm = () => {
    form.reset()
    setStep('selection')
    setError(null)
  }
  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }
  const getClientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
  const renderClientCard = (client: MergeableClient, role: 'primary' | 'secondary') => (
    <Card className={role === 'primary' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {getClientInitials(client.contactFirstName, client.contactLastName)}
            </AvatarFallback>
          </Avatar>
          {client.companyName}
          <Badge variant={role === 'primary' ? 'default' : 'secondary'}>
            {role === 'primary' ? 'Principal' : 'À fusionner'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Contact
            </div>
            <div>{client.contactFirstName} {client.contactLastName}</div>
            <div className="text-gray-500">{client.contactEmail}</div>
            <div className="text-gray-500">{client.contactPhone}</div>
          </div>
          <div>
            <div className="font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Adresse
            </div>
            <div>{client.city}</div>
            <div className="text-gray-500">{client.postalCode}</div>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Commandes
            </div>
            <div>{client.totalOrders}</div>
            <div className="text-gray-500">{client.totalRevenue.toLocaleString()}€</div>
          </div>
          <div>
            <div className="font-medium flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Crédit
            </div>
            <div>{client.creditUsed.toLocaleString()}€ / {client.creditLimit.toLocaleString()}€</div>
          </div>
          <div>
            <div className="font-medium">Impayés</div>
            <div className={client.unpaidAmount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
              {client.unpaidAmount.toLocaleString()}€
            </div>
          </div>
        </div>
        {client.notes && (
          <div>
            <div className="font-medium">Notes</div>
            <div className="text-sm text-gray-600 max-w-full overflow-hidden">
              {client.notes.length > 100 ? `${client.notes.substring(0, 100)}...` : client.notes}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fusionner des clients - {step === 'selection' ? 'Sélection' : 
                                   step === 'configuration' ? 'Configuration' : 'Prévisualisation'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <div>{error}</div>
                </Alert>
              )}
              {/* Step 1: Client Selection */}
              {step === 'selection' && (
                <div className="space-y-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <div className="font-semibold">Attention</div>
                      <div>La fusion de clients est irréversible. Le client secondaire sera supprimé et toutes ses données seront transférées vers le client principal.</div>
                    </div>
                  </Alert>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="primaryClientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client principal (sera conservé)</FormLabel>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange}>
                              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {clients.map((client) => (
                                  <div key={client.id} className="flex items-start space-x-2">
                                    <RadioGroupItem 
                                      value={client.id} 
                                      id={`primary-${client.id}`}
                                      disabled={client.id === watchSecondaryId}
                                    />
                                    <Label 
                                      htmlFor={`primary-${client.id}`} 
                                      className="flex-1 cursor-pointer"
                                    >
                                      <Card className="hover:bg-gray-50">
                                        <CardContent className="p-3">
                                          <div className="font-medium">{client.companyName}</div>
                                          <div className="text-sm text-gray-500">
                                            {client.contactFirstName} {client.contactLastName} • {client.city}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {client.totalOrders} commandes • {client.totalRevenue.toLocaleString()}€
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondaryClientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client à fusionner (sera supprimé)</FormLabel>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange}>
                              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {clients.map((client) => (
                                  <div key={client.id} className="flex items-start space-x-2">
                                    <RadioGroupItem 
                                      value={client.id} 
                                      id={`secondary-${client.id}`}
                                      disabled={client.id === watchPrimaryId}
                                    />
                                    <Label 
                                      htmlFor={`secondary-${client.id}`} 
                                      className="flex-1 cursor-pointer"
                                    >
                                      <Card className="hover:bg-gray-50">
                                        <CardContent className="p-3">
                                          <div className="font-medium">{client.companyName}</div>
                                          <div className="text-sm text-gray-500">
                                            {client.contactFirstName} {client.contactLastName} • {client.city}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {client.totalOrders} commandes • {client.totalRevenue.toLocaleString()}€
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {primaryClient && secondaryClient && (
                    <div className="pt-4">
                      <Button 
                        type="button" 
                        onClick={() => setStep('configuration')}
                        className="w-full"
                      >
                        Configurer la fusion <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {/* Step 2: Merge Configuration */}
              {step === 'configuration' && primaryClient && secondaryClient && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {renderClientCard(primaryClient, 'primary')}
                    {renderClientCard(secondaryClient, 'secondary')}
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuration de fusion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="mergeStrategy.companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de l'entreprise</FormLabel>
                            <FormControl>
                              <RadioGroup value={field.value} onValueChange={field.onChange}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="primary" id="name-primary" />
                                  <Label htmlFor="name-primary">Conserver "{primaryClient.companyName}"</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="secondary" id="name-secondary" />
                                  <Label htmlFor="name-secondary">Utiliser "{secondaryClient.companyName}"</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mergeStrategy.contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Informations de contact</FormLabel>
                            <FormControl>
                              <RadioGroup value={field.value} onValueChange={field.onChange}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="primary" id="contact-primary" />
                                  <Label htmlFor="contact-primary">
                                    Conserver {primaryClient.contactFirstName} {primaryClient.contactLastName}
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="secondary" id="contact-secondary" />
                                  <Label htmlFor="contact-secondary">
                                    Utiliser {secondaryClient.contactFirstName} {secondaryClient.contactLastName}
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mergeStrategy.billing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Données financières</FormLabel>
                            <FormControl>
                              <RadioGroup value={field.value} onValueChange={field.onChange}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="combine" id="billing-combine" />
                                  <Label htmlFor="billing-combine">
                                    Combiner (crédit utilisé, commandes, chiffre d'affaires)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="primary" id="billing-primary" />
                                  <Label htmlFor="billing-primary">Conserver uniquement les données du client principal</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mergeNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Raison de la fusion *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Expliquez pourquoi ces clients doivent être fusionnés..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setStep('selection')}
                    >
                      Retour
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setStep('preview')}
                      className="flex-1"
                    >
                      Prévisualiser la fusion <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {/* Step 3: Preview and Confirmation */}
              {step === 'preview' && primaryClient && secondaryClient && mergedPreview && (
                <div className="space-y-6">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        Aperçu du client fusionné
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <div className="font-semibold">Informations générales</div>
                            <div>Entreprise: {mergedPreview.companyName}</div>
                            <div>Contact: {mergedPreview.contactFirstName} {mergedPreview.contactLastName}</div>
                            <div>Email: {mergedPreview.contactEmail}</div>
                            <div>Téléphone: {mergedPreview.contactPhone}</div>
                            <div>Adresse: {mergedPreview.address}, {mergedPreview.city}</div>
                          </div>
                          <div>
                            <div className="font-semibold">Données consolidées</div>
                            <div>Total commandes: {mergedPreview.totalOrders}</div>
                            <div>Chiffre d'affaires: {mergedPreview.totalRevenue.toLocaleString()}€</div>
                            <div>Crédit utilisé: {mergedPreview.creditUsed.toLocaleString()}€</div>
                            <div>Limite de crédit: {mergedPreview.creditLimit.toLocaleString()}€</div>
                            <div>Impayés: {mergedPreview.unpaidAmount.toLocaleString()}€</div>
                          </div>
                        </div>
                        {mergedPreview.notes && (
                          <div>
                            <div className="font-semibold">Notes fusionnées</div>
                            <div className="text-sm bg-white p-3 rounded border max-h-32 overflow-y-auto">
                              {mergedPreview.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                      <div className="font-semibold">Confirmation requise</div>
                      <div>Cette action supprimera définitivement le client "{secondaryClient.companyName}" et transférera toutes ses données vers "{primaryClient.companyName}".</div>
                    </div>
                  </Alert>
                  <FormField
                    control={form.control}
                    name="confirmDeletion"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            Je confirme vouloir supprimer le client "{secondaryClient.companyName}" et transférer ses données vers "{primaryClient.companyName}"
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setStep('configuration')}
                    >
                      Retour
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || !form.watch('confirmDeletion')}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {loading ? 'Fusion en cours...' : 'Confirmer la fusion'}
                    </Button>
                  </div>
                </div>
              )}
              {step === 'selection' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
