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
// Quote line item schema
const quoteLineSchema = z.object({
  description: z.string().min(1, 'La description est obligatoire'),
  quantity: z.number().positive('La quantité doit être positive'),
  unitPrice: z.number().positive('Le prix unitaire doit être positif'),
  discount: z.number().min(0).max(100).default(0)
})
// Main quote schema
const quoteSchema = z.object({
  quoteNumber: z.string().min(1, 'Le numéro de devis est obligatoire'),
  clientId: z.string().min(1, 'Le client est obligatoire'),
  issueDate: z.string().min(1, 'La date d\'émission est obligatoire'),
  validUntil: z.string().min(1, 'La date de validité est obligatoire'),
  projectId: z.string().optional(),
  lines: z.array(quoteLineSchema).min(1, 'Au moins une ligne est requise'),
  terms: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default('EUR'),
  validityPeriod: z.number().default(30),
  globalDiscount: z.number().min(0).max(100).default(0)
})
type QuoteFormData = z.infer<typeof quoteSchema>
interface Client {
  id: string
  name: string
  email: string
}
interface CreateQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: QuoteFormData) => void | Promise<void>
  clients?: Client[]
  defaultClientId?: string
}
export function CreateQuoteDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  clients = [],
  defaultClientId
}: CreateQuoteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mockClients: Client[] = useMemo(() => [
    { id: '1', name: 'Société ABC', email: 'contact@abc.fr' },
    { id: '2', name: 'Construction XYZ', email: 'admin@xyz.fr' }
  ], [])
  const availableClients = clients.length > 0 ? clients : mockClients
  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      quoteNumber: '',
      clientId: defaultClientId || '',
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projectId: '',
      lines: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0
      }],
      terms: 'Devis valable 30 jours. Prix indicatif, non contractuel.',
      notes: '',
      currency: 'EUR',
      validityPeriod: 30,
      globalDiscount: 0
    }
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines'
  })
  const watchedLines = form.watch('lines')
  const watchedGlobalDiscount = form.watch('globalDiscount')
  // Generate quote number when dialog opens
  useEffect(() => {
    if (open && !form.getValues('quoteNumber')) {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const quoteNumber = `DEVIS-${year}${month}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      form.setValue('quoteNumber', quoteNumber)
    }
  }, [open, form])
  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = watchedLines.reduce((sum, line) => {
      const lineTotal = line.quantity * line.unitPrice
      const lineDiscount = lineTotal * (line.discount || 0) / 100
      return sum + (lineTotal - lineDiscount)
    }, 0)
    const globalDiscountAmount = subtotal * (watchedGlobalDiscount || 0) / 100
    const totalAmount = subtotal - globalDiscountAmount
    return {
      subtotal,
      globalDiscountAmount,
      totalAmount
    }
  }, [watchedLines, watchedGlobalDiscount])
  const handleSubmit = async (data: QuoteFormData) => {
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
      discount: 0
    })
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Créer un devis
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {/* Quote Header */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations générales</h3>
                <FormField
                  control={form.control}
                  name="quoteNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de devis *</FormLabel>
                      <FormControl>
                        <Input placeholder="DEVIS-2024-001" {...field} />
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
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valide jusqu'au *</FormLabel>
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
                <h3 className="text-lg font-medium">Client</h3>
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
                <FormField
                  control={form.control}
                  name="validityPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Période de validité (jours)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Quote Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Lignes du devis</h3>
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
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Description du produit/service"
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
                    </div>
                    <div className="mt-3 pt-3 border-t bg-gray-50 rounded p-2">
                      <div className="text-sm text-right">
                        <span className="font-medium">
                          Total ligne: {((field.quantity || 0) * (field.unitPrice || 0)).toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Summary and Options */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conditions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conditions du devis..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Récapitulatif</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sous-total:</span>
                    <span>{calculations.subtotal.toFixed(2)} €</span>
                  </div>
                  {calculations.globalDiscountAmount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Remise globale:</span>
                      <span>-{calculations.globalDiscountAmount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span>{calculations.totalAmount.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes supplémentaires..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {loading ? 'Création en cours...' : 'Créer le devis'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
