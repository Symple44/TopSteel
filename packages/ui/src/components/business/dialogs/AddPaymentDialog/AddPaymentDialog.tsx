'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms/form/form'
import { Button } from '../../../primitives/button/Button'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
import { Textarea } from '../../../primitives/textarea/Textarea'

// Validation schema for payment
const paymentFormSchema = z.object({
  amount: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  currency: z.string().min(1, 'La devise est requise'),
  paymentMethod: z.enum([
    'cash',
    'check',
    'bank_transfer',
    'card',
    'letter_of_credit',
    'wire_transfer',
  ]),
  paymentDate: z.string().min(1, 'La date de paiement est requise'),
  dueDate: z.string().optional(),
  invoiceId: z.string().optional(),
  clientId: z.string().min(1, 'Le client est requis'),
  reference: z.string().min(1, 'La référence est requise'),
  description: z.string().optional(),
  // Payment method specific fields
  checkNumber: z.string().optional(),
  bankDetails: z
    .object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
      swiftCode: z.string().optional(),
    })
    .optional(),
  // Reconciliation fields
  reconciled: z.boolean().default(false),
  reconciledDate: z.string().optional(),
  reconciledBy: z.string().optional(),
  reconciliationNote: z.string().optional(),
  // Steel industry specific
  projectId: z.string().optional(),
  materialDeliveryId: z.string().optional(),
  paymentTerms: z.enum(['net_30', 'net_60', 'net_90', 'cod', 'prepaid', '2_10_net_30']).optional(),
  retentionAmount: z.number().min(0).optional(),
  progressPayment: z.boolean().default(false),
  percentageComplete: z.number().min(0).max(100).optional(),
  // Taxes and fees
  taxAmount: z.number().min(0).optional(),
  feeAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  // Documentation
  attachments: z.array(z.string()).optional(),
  approvedBy: z.string().optional(),
  approvalDate: z.string().optional(),
})
type PaymentFormData = z.infer<typeof paymentFormSchema>
interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: PaymentFormData) => void
  invoiceId?: string
  clientId?: string
  initialData?: Partial<PaymentFormData>
  availableClients?: Array<{ id: string; name: string; company: string }>
  availableInvoices?: Array<{ id: string; reference: string; amount: number; dueAmount: number }>
  availableProjects?: Array<{ id: string; name: string; client: string }>
}
export function AddPaymentDialog({
  open,
  onOpenChange,
  onSubmit,
  invoiceId,
  clientId,
  initialData,
  availableClients = [],
  availableInvoices = [],
  availableProjects = [],
}: AddPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const form = useForm({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      currency: initialData?.currency || 'EUR',
      paymentMethod: initialData?.paymentMethod || 'bank_transfer',
      paymentDate: initialData?.paymentDate || new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate || '',
      invoiceId: invoiceId || initialData?.invoiceId || '',
      clientId: clientId || initialData?.clientId || '',
      reference: initialData?.reference || '',
      description: initialData?.description || '',
      checkNumber: initialData?.checkNumber || '',
      bankDetails: initialData?.bankDetails || {
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
      },
      reconciled: initialData?.reconciled || false,
      reconciledDate: initialData?.reconciledDate || '',
      reconciledBy: initialData?.reconciledBy || '',
      reconciliationNote: initialData?.reconciliationNote || '',
      projectId: initialData?.projectId || '',
      materialDeliveryId: initialData?.materialDeliveryId || '',
      paymentTerms: initialData?.paymentTerms || 'net_30',
      retentionAmount: initialData?.retentionAmount || 0,
      progressPayment: initialData?.progressPayment || false,
      percentageComplete: initialData?.percentageComplete || 0,
      taxAmount: initialData?.taxAmount || 0,
      feeAmount: initialData?.feeAmount || 0,
      discountAmount: initialData?.discountAmount || 0,
      attachments: initialData?.attachments || [],
      approvedBy: initialData?.approvedBy || '',
      approvalDate: initialData?.approvalDate || '',
    },
  })
  const selectedPaymentMethod = form.watch('paymentMethod')
  const isProgressPayment = form.watch('progressPayment')
  const selectedClient = form.watch('clientId')
  const handleSubmit = async (data: PaymentFormData) => {
    setLoading(true)
    try {
      // Calculate net amount after discounts and fees
      const netAmount =
        data.amount - (data.discountAmount || 0) + (data.taxAmount || 0) + (data.feeAmount || 0)
      // Add calculated fields
      const paymentData = {
        ...data,
        netAmount,
        status: data.reconciled ? 'reconciled' : 'pending',
        createdAt: new Date().toISOString(),
      }
      await onSubmit?.(paymentData)
      onOpenChange(false)
      form.reset()
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }
  const paymentMethodOptions = [
    { value: 'cash', label: 'Espèces' },
    { value: 'check', label: 'Chèque' },
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'card', label: 'Carte bancaire' },
    { value: 'letter_of_credit', label: 'Lettre de crédit' },
    { value: 'wire_transfer', label: 'Transfert électronique' },
  ]
  const paymentTermsOptions = [
    { value: 'net_30', label: 'Net 30 jours' },
    { value: 'net_60', label: 'Net 60 jours' },
    { value: 'net_90', label: 'Net 90 jours' },
    { value: 'cod', label: 'Paiement à la livraison' },
    { value: 'prepaid', label: 'Prépayé' },
    { value: '2_10_net_30', label: '2/10 Net 30' },
  ]
  const currencyOptions = [
    { value: 'EUR', label: '€ Euro' },
    { value: 'USD', label: '$ Dollar américain' },
    { value: 'GBP', label: '£ Livre sterling' },
    { value: 'CAD', label: '$ Dollar canadien' },
  ]
  // Filter invoices by selected client
  const filteredInvoices = selectedClient
    ? availableInvoices.filter(
        (invoice) =>
          availableClients.find((client) => client.id === selectedClient)?.name ===
          invoice.reference.split('-')[0]
      )
    : availableInvoices
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un paiement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Payment Information */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company} - {client.name}
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
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facture</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une facture" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredInvoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.reference} - Dû: {invoice.dueAmount.toFixed(2)}€
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
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un projet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} ({project.client})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Payment Details */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Méthode de paiement *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de paiement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentTermsOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de paiement *</FormLabel>
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
                    <FormLabel>Date d'échéance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence *</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: PAY-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Payment Method Specific Fields */}
            {selectedPaymentMethod === 'check' && (
              <FormField
                control={form.control}
                name="checkNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de chèque</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro du chèque" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {(selectedPaymentMethod === 'bank_transfer' ||
              selectedPaymentMethod === 'wire_transfer') && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Détails bancaires</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankDetails.bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la banque</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de la banque" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de compte</FormLabel>
                        <FormControl>
                          <Input placeholder="Numéro de compte" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.routingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code de routage</FormLabel>
                        <FormControl>
                          <Input placeholder="Code de routage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankDetails.swiftCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code SWIFT</FormLabel>
                        <FormControl>
                          <Input placeholder="Code SWIFT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            {/* Steel Industry Specific */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="progressPayment"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Paiement d'avancement</FormLabel>
                    </FormItem>
                  )}
                />
                {isProgressPayment && (
                  <FormField
                    control={form.control}
                    name="percentageComplete"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% d'avancement</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={form.control}
                name="retentionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant de rétention</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Taxes and Fees */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant des taxes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frais</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remise</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes et détails additionnels..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Reconciliation Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rapprochement</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reconciled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Rapprochement effectué</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reconciledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de rapprochement</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="reconciliationNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note de rapprochement</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Détails du rapprochement..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Traitement...' : 'Enregistrer le paiement'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
