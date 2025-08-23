'use client'
import { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Calculator, FileText, User, Calendar, Package } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Badge,
  Label
} from '../../../primitives'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../../../forms'
// Invoice line item schema
const invoiceLineSchema = z.object({
  description: z.string().min(1, 'La description est obligatoire'),
  quantity: z.number().positive('La quantité doit être positive'),
  unitPrice: z.number().positive('Le prix unitaire doit être positif'),
  taxRate: z.number().min(0, 'Le taux de TVA doit être positif ou nul').max(100, 'Le taux de TVA ne peut pas dépasser 100%'),
  discount: z.number().min(0, 'La remise doit être positive ou nulle').max(100, 'La remise ne peut pas dépasser 100%').default(0)
})
// Main invoice schema
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Le numéro de facture est obligatoire'),
  clientId: z.string().min(1, 'Le client est obligatoire'),
  issueDate: z.string().min(1, 'La date d\'émission est obligatoire'),
  dueDate: z.string().min(1, 'La date d\'échéance est obligatoire'),
  paymentTerms: z.string().min(1, 'Les conditions de paiement sont obligatoires'),
  paymentMethod: z.string().optional(),
  projectId: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'Au moins une ligne est requise'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  currency: z.string().default('EUR'),
  language: z.string().default('fr'),
  includeTransport: z.boolean().default(false),
  transportCost: z.number().min(0).optional(),
  globalDiscount: z.number().min(0).max(100).default(0)
})
type InvoiceFormData = z.infer<typeof invoiceSchema>
interface Client {
  id: string
  name: string
  email: string
  address?: string
  vatNumber?: string
}
interface Project {
  id: string
  name: string
  reference: string
  clientId: string
}
interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: InvoiceFormData) => void | Promise<void>
  clients?: Client[]
  projects?: Project[]
  defaultClientId?: string
  defaultProjectId?: string
}
export function CreateInvoiceDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  clients = [],
  projects = [],
  defaultClientId,
  defaultProjectId
}: CreateInvoiceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mock data for demonstration
  const mockClients: Client[] = useMemo(() => [
    {
      id: '1',
      name: 'Société Industrielle ABC',
      email: 'contact@abc-industrie.fr',
      address: '123 rue de l\'Industrie, 75001 Paris',
      vatNumber: 'FR12345678901'
    },
    {
      id: '2',
      name: 'Construction XYZ',
      email: 'admin@construction-xyz.fr',
      address: '456 avenue des Bâtisseurs, 69000 Lyon',
      vatNumber: 'FR98765432109'
    }
  ], [])
  const mockProjects: Project[] = useMemo(() => [
    {
      id: '1',
      name: 'Rénovation usine',
      reference: 'PRJ-2024-001',
      clientId: '1'
    },
    {
      id: '2',
      name: 'Construction hangar',
      reference: 'PRJ-2024-002',
      clientId: '2'
    }
  ], [])
  const availableClients = clients.length > 0 ? clients : mockClients
  const availableProjects = projects.length > 0 ? projects : mockProjects
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      clientId: defaultClientId || '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: '30',
      paymentMethod: '',
      projectId: defaultProjectId || '',
      lines: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 20,
        discount: 0
      }],
      notes: '',
      internalNotes: '',
      currency: 'EUR',
      language: 'fr',
      includeTransport: false,
      transportCost: 0,
      globalDiscount: 0
    }
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines'
  })
  // Watch form values for calculations
  const watchedLines = form.watch('lines')
  const watchedGlobalDiscount = form.watch('globalDiscount')
  const watchedTransportCost = form.watch('transportCost')
  const watchedIncludeTransport = form.watch('includeTransport')
  const watchedClientId = form.watch('clientId')
  // Generate invoice number when dialog opens
  useEffect(() => {
    if (open && !form.getValues('invoiceNumber')) {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const invoiceNumber = `FACT-${year}${month}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      form.setValue('invoiceNumber', invoiceNumber)
    }
  }, [open, form])
  // Filter projects based on selected client
  const filteredProjects = useMemo(() => {
    if (!watchedClientId) return availableProjects
    return availableProjects.filter(project => project.clientId === watchedClientId)
  }, [watchedClientId, availableProjects])
  // Calculate totals
  const calculations = useMemo(() => {
    const subtotalBeforeDiscount = watchedLines.reduce((sum, line) => {
      return sum + (line.quantity * line.unitPrice)
    }, 0)
    const lineDiscounts = watchedLines.reduce((sum, line) => {
      const lineTotal = line.quantity * line.unitPrice
      return sum + (lineTotal * (line.discount || 0) / 100)
    }, 0)
    const subtotalAfterLineDiscounts = subtotalBeforeDiscount - lineDiscounts
    const globalDiscountAmount = subtotalAfterLineDiscounts * (watchedGlobalDiscount || 0) / 100
    const subtotalAfterAllDiscounts = subtotalAfterLineDiscounts - globalDiscountAmount
    const transportCost = watchedIncludeTransport ? (watchedTransportCost || 0) : 0
    const subtotalWithTransport = subtotalAfterAllDiscounts + transportCost
    const taxes = watchedLines.reduce((sum, line) => {
      const lineTotal = line.quantity * line.unitPrice
      const lineDiscount = lineTotal * (line.discount || 0) / 100
      const lineSubtotal = lineTotal - lineDiscount
      const globalDiscountForLine = lineSubtotal * (watchedGlobalDiscount || 0) / 100
      const lineAfterDiscounts = lineSubtotal - globalDiscountForLine
      return sum + (lineAfterDiscounts * (line.taxRate || 0) / 100)
    }, 0)
    const transportTax = transportCost * 0.20 // Assuming 20% VAT on transport
    const totalTaxes = taxes + (watchedIncludeTransport ? transportTax : 0)
    const totalAmount = subtotalWithTransport + totalTaxes
    return {
      subtotalBeforeDiscount,
      lineDiscounts,
      globalDiscountAmount,
      transportCost,
      taxes: totalTaxes,
      totalAmount
    }
  }, [watchedLines, watchedGlobalDiscount, watchedTransportCost, watchedIncludeTransport])
  const handleSubmit = async (data: InvoiceFormData) => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit?.(data)
      onOpenChange(false)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }
  const handleClose = () => {
    if (!loading) {
      form.reset()
      setError(null)
      onOpenChange(false)
    }
  }
  const addLine = () => {
    append({
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      discount: 0
    })
  }
  const selectedClient = availableClients.find(client => client.id === watchedClientId)
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Créer une facture
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Informations générales
                </h3>
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de facture *</FormLabel>
                      <FormControl>
                        <Input placeholder="FACT-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'émission *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'échéance *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Client
                </h3>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableClients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedClient && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="font-medium">{selectedClient.name}</div>
                    {selectedClient.address && <div className="text-gray-600">{selectedClient.address}</div>}
                    {selectedClient.email && <div className="text-gray-600">{selectedClient.email}</div>}
                    {selectedClient.vatNumber && (
                      <div className="text-gray-600">TVA: {selectedClient.vatNumber}</div>
                    )}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projet (optionnel)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un projet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Aucun projet</SelectItem>
                          {filteredProjects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.reference} - {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Payment Terms */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de paiement *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Paiement comptant</SelectItem>
                        <SelectItem value="15">15 jours</SelectItem>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="45">45 jours</SelectItem>
                        <SelectItem value="60">60 jours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode de paiement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Non spécifié</SelectItem>
                        <SelectItem value="virement">Virement bancaire</SelectItem>
                        <SelectItem value="cheque">Chèque</SelectItem>
                        <SelectItem value="especes">Espèces</SelectItem>
                        <SelectItem value="cb">Carte bancaire</SelectItem>
                        <SelectItem value="prelevement">Prélèvement</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Invoice Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Lignes de facturation
                </h3>
                <Button type="button" onClick={addLine} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une ligne
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium">Ligne {index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          className="ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Description de l'article/service"
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="1"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`lines.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prix unitaire (€) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.taxRate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TVA (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="20"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`lines.${index}.discount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Remise (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="0"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    {/* Line total display */}
                    <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-2">
                      <div className="text-sm text-right">
                        <span className="font-medium">
                          Total ligne: {((field.quantity || 0) * (field.unitPrice || 0) * (1 - (field.discount || 0) / 100)).toFixed(2)} € HT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Global Options */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Options globales</h3>
                <FormField
                  control={form.control}
                  name="globalDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remise globale (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Remise appliquée sur le sous-total
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="includeTransport"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Inclure les frais de transport</FormLabel>
                        <FormDescription>
                          Ajouter une ligne pour les frais de transport
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {watchedIncludeTransport && (
                  <FormField
                    control={form.control}
                    name="transportCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût transport (€ HT)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {/* Invoice Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Récapitulatif
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sous-total HT:</span>
                    <span>{(calculations.subtotalBeforeDiscount - calculations.lineDiscounts).toFixed(2)} €</span>
                  </div>
                  {calculations.globalDiscountAmount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Remise globale:</span>
                      <span>-{calculations.globalDiscountAmount.toFixed(2)} €</span>
                    </div>
                  )}
                  {watchedIncludeTransport && calculations.transportCost > 0 && (
                    <div className="flex justify-between">
                      <span>Transport HT:</span>
                      <span>{calculations.transportCost.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total TVA:</span>
                    <span>{calculations.taxes.toFixed(2)} €</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-base">
                      <span>Total TTC:</span>
                      <span>{calculations.totalAmount.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Notes */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes client</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes visibles sur la facture..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ces notes apparaîtront sur la facture
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes internes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes internes (non visibles sur la facture)..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ces notes ne seront pas visibles sur la facture
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer la facture'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
