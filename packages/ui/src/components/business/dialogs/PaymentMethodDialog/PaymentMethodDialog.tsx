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

// Validation schema for payment method configuration
const paymentMethodFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum([
    'cash',
    'check',
    'bank_transfer',
    'card',
    'letter_of_credit',
    'wire_transfer',
    'crypto',
  ]),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  // Payment terms
  defaultTerms: z
    .enum(['net_30', 'net_60', 'net_90', 'cod', 'prepaid', '2_10_net_30', 'custom'])
    .optional(),
  customTermsDays: z.number().min(0).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  discountDays: z.number().min(0).optional(),
  // Fee structure
  processingFee: z.number().min(0).optional(),
  processingFeeType: z.enum(['fixed', 'percentage']).optional(),
  minimumAmount: z.number().min(0).optional(),
  maximumAmount: z.number().min(0).optional(),
  // Banking details (for bank transfers)
  bankDetails: z
    .object({
      bankName: z.string().optional(),
      accountName: z.string().optional(),
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
      swiftCode: z.string().optional(),
      iban: z.string().optional(),
      branchAddress: z.string().optional(),
    })
    .optional(),
  // Card processing (for card payments)
  cardProcessor: z
    .object({
      provider: z.string().optional(),
      merchantId: z.string().optional(),
      apiKey: z.string().optional(),
      publicKey: z.string().optional(),
      testMode: z.boolean().default(false),
    })
    .optional(),
  // Letter of credit specifics
  letterOfCreditTerms: z
    .object({
      issuingBank: z.string().optional(),
      confirmingBank: z.string().optional(),
      validityPeriod: z.number().min(0).optional(),
      documentRequirement: z.string().optional(),
    })
    .optional(),
  // Steel industry specific configurations
  steelIndustryConfig: z
    .object({
      allowProgressPayments: z.boolean().default(false),
      requireDeliveryConfirmation: z.boolean().default(false),
      allowRetention: z.boolean().default(false),
      retentionPercentage: z.number().min(0).max(100).optional(),
      retentionPeriod: z.number().min(0).optional(),
      requireQualityInspection: z.boolean().default(false),
      allowPartialPayments: z.boolean().default(false),
    })
    .optional(),
  // Approval workflow
  requiresApproval: z.boolean().default(false),
  approvalThreshold: z.number().min(0).optional(),
  approvers: z.array(z.string()).optional(),
  // Reconciliation settings
  autoReconcile: z.boolean().default(false),
  reconciliationAccount: z.string().optional(),
  reconciliationPeriod: z.enum(['daily', 'weekly', 'monthly']).optional(),
  // Notifications
  notifyOnPayment: z.boolean().default(false),
  notificationRecipients: z.array(z.string()).optional(),
  // Integration settings
  integrationConfig: z
    .object({
      erp: z.boolean().default(false),
      accounting: z.boolean().default(false),
      bankingApi: z.boolean().default(false),
      apiEndpoint: z.string().optional(),
      webhookUrl: z.string().optional(),
    })
    .optional(),
})
type PaymentMethodFormData = z.infer<typeof paymentMethodFormSchema>
interface PaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: PaymentMethodFormData) => void
  initialData?: Partial<PaymentMethodFormData>
  editMode?: boolean
  availableUsers?: Array<{ id: string; name: string; role: string }>
}
export function PaymentMethodDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  editMode = false,
  availableUsers = [],
}: PaymentMethodDialogProps) {
  const [loading, setLoading] = useState(false)
  const form = useForm({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'bank_transfer',
      description: initialData?.description || '',
      isActive: initialData?.isActive ?? true,
      isDefault: initialData?.isDefault ?? false,
      defaultTerms: initialData?.defaultTerms || 'net_30',
      customTermsDays: initialData?.customTermsDays || 0,
      discountPercentage: initialData?.discountPercentage || 0,
      discountDays: initialData?.discountDays || 0,
      processingFee: initialData?.processingFee || 0,
      processingFeeType: initialData?.processingFeeType || 'fixed',
      minimumAmount: initialData?.minimumAmount || 0,
      maximumAmount: initialData?.maximumAmount || 0,
      bankDetails: initialData?.bankDetails || {
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        swiftCode: '',
        iban: '',
        branchAddress: '',
      },
      cardProcessor: initialData?.cardProcessor || {
        provider: '',
        merchantId: '',
        apiKey: '',
        publicKey: '',
        testMode: false,
      },
      letterOfCreditTerms: initialData?.letterOfCreditTerms || {
        issuingBank: '',
        confirmingBank: '',
        validityPeriod: 90,
        documentRequirement: '',
      },
      steelIndustryConfig: initialData?.steelIndustryConfig || {
        allowProgressPayments: false,
        requireDeliveryConfirmation: false,
        allowRetention: false,
        retentionPercentage: 0,
        retentionPeriod: 0,
        requireQualityInspection: false,
        allowPartialPayments: false,
      },
      requiresApproval: initialData?.requiresApproval || false,
      approvalThreshold: initialData?.approvalThreshold || 0,
      approvers: initialData?.approvers || [],
      autoReconcile: initialData?.autoReconcile || false,
      reconciliationAccount: initialData?.reconciliationAccount || '',
      reconciliationPeriod: initialData?.reconciliationPeriod || 'monthly',
      notifyOnPayment: initialData?.notifyOnPayment || false,
      notificationRecipients: initialData?.notificationRecipients || [],
      integrationConfig: initialData?.integrationConfig || {
        erp: false,
        accounting: false,
        bankingApi: false,
        apiEndpoint: '',
        webhookUrl: '',
      },
    },
  })
  const selectedType = form.watch('type')
  const requiresApproval = form.watch('requiresApproval')
  const allowRetention = form.watch('steelIndustryConfig.allowRetention')
  const defaultTerms = form.watch('defaultTerms')
  const handleSubmit = async (data: PaymentMethodFormData) => {
    setLoading(true)
    try {
      await onSubmit?.(data)
      onOpenChange(false)
      form.reset()
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }
  const paymentTypeOptions = [
    { value: 'cash', label: 'Espèces' },
    { value: 'check', label: 'Chèque' },
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'card', label: 'Carte bancaire' },
    { value: 'letter_of_credit', label: 'Lettre de crédit' },
    { value: 'wire_transfer', label: 'Transfert électronique' },
    { value: 'crypto', label: 'Cryptomonnaie' },
  ]
  const paymentTermsOptions = [
    { value: 'net_30', label: 'Net 30 jours' },
    { value: 'net_60', label: 'Net 60 jours' },
    { value: 'net_90', label: 'Net 90 jours' },
    { value: 'cod', label: 'Paiement à la livraison' },
    { value: 'prepaid', label: 'Prépayé' },
    { value: '2_10_net_30', label: '2/10 Net 30' },
    { value: 'custom', label: 'Personnalisé' },
  ]
  const reconciliationPeriodOptions = [
    { value: 'daily', label: 'Quotidien' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Modifier la méthode de paiement' : 'Configurer une méthode de paiement'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la méthode *</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Virement Standard" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de paiement *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentTypeOptions.map((option) => (
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description de la méthode de paiement..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Méthode active</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>Méthode par défaut</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            {/* Payment Terms */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Conditions de paiement</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conditions par défaut</FormLabel>
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
                {defaultTerms === 'custom' && (
                  <FormField
                    control={form.control}
                    name="customTermsDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jours personnalisés</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>% de remise anticipée</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
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
                  name="discountDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jours pour remise</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Fee Structure */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Structure des frais</h3>
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="processingFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais de traitement</FormLabel>
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
                  name="processingFeeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de frais</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Montant fixe</SelectItem>
                          <SelectItem value="percentage">Pourcentage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minimumAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant minimum</FormLabel>
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
                  name="maximumAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant maximum</FormLabel>
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
            </div>
            {/* Payment Type Specific Configuration */}
            {selectedType === 'bank_transfer' && (
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
                    name="bankDetails.accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du compte</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du titulaire" {...field} />
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
                    name="bankDetails.iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input placeholder="IBAN" {...field} />
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
                          <Input placeholder="Code SWIFT/BIC" {...field} />
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
                </div>
                <FormField
                  control={form.control}
                  name="bankDetails.branchAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse de l'agence</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Adresse complète de l'agence..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {selectedType === 'letter_of_credit' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuration lettre de crédit</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="letterOfCreditTerms.issuingBank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banque émettrice</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de la banque émettrice" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="letterOfCreditTerms.confirmingBank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banque confirmante</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de la banque confirmante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="letterOfCreditTerms.validityPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Période de validité (jours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="letterOfCreditTerms.documentRequirement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exigences documentaires</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Documents requis pour la lettre de crédit..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {/* Steel Industry Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuration industrie sidérurgique</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="steelIndustryConfig.allowProgressPayments"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Autoriser les paiements d'avancement</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="steelIndustryConfig.requireDeliveryConfirmation"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Confirmation de livraison requise</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="steelIndustryConfig.allowRetention"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Autoriser la rétention de garantie</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="steelIndustryConfig.requireQualityInspection"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Contrôle qualité requis</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              {allowRetention && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="steelIndustryConfig.retentionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% de rétention</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
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
                    name="steelIndustryConfig.retentionPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Période de rétention (jours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            {/* Approval Workflow */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Workflow d'approbation</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Approbation requise</FormLabel>
                    </FormItem>
                  )}
                />
                {requiresApproval && (
                  <FormField
                    control={form.control}
                    name="approvalThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seuil d'approbation (€)</FormLabel>
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
                )}
              </div>
            </div>
            {/* Reconciliation Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Paramètres de rapprochement</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="autoReconcile"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>Rapprochement automatique</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reconciliationPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Période de rapprochement</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reconciliationPeriodOptions.map((option) => (
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
              <FormField
                control={form.control}
                name="reconciliationAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte de rapprochement</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro de compte comptable" {...field} />
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
                {loading ? 'Configuration...' : editMode ? 'Mettre à jour' : 'Créer la méthode'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
