'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { Button } from '../../../primitives/button/Button'
import { DialogTrigger } from '../../../primitives/dialog/Dialog'
import { Input } from '../../../primitives/input/Input'
import { FormMessage } from '../../../forms/form/form'
import { CardFooter } from '../../../layout/card'
import { SelectValue } from '../../../primitives/select/select'
import { Switch } from '../../../primitives/switch/switch'
import { Textarea } from '../../../primitives/textarea/Textarea'
import { ScrollArea } from '../../../layout/scroll-area/ScrollArea'
// Expense validation schema
const expenseSchema = z.object({
  // Basic Information
  title: z.string().min(1, 'Le titre de la dépense est requis'),
  description: z.string().optional(),
  category: z.enum([
    'materials',
    'equipment',
    'transport',
    'maintenance',
    'utilities',
    'office',
    'marketing',
    'professional_services',
    'insurance',
    'taxes',
    'other'
  ]),
  subcategory: z.string().optional(),
  // Financial Information
  amount: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  currency: z.string().default('EUR'),
  taxAmount: z.number().min(0, 'Le montant de la TVA doit être positif').default(0),
  taxRate: z.number().min(0).max(100, 'Le taux de TVA doit être entre 0 et 100').default(20),
  // Payment Information
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'check', 'other']),
  paymentDate: z.string().min(1, 'La date de paiement est requise'),
  receiptNumber: z.string().optional(),
  // Supplier Information
  supplierName: z.string().min(1, 'Le nom du fournisseur est requis'),
  supplierEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  supplierPhone: z.string().optional(),
  supplierAddress: z.string().optional(),
  // Project/Cost Center
  projectId: z.string().optional(),
  costCenter: z.string().optional(),
  department: z.enum(['production', 'sales', 'administration', 'logistics', 'maintenance', 'other']).optional(),
  // Approval and Documentation
  receiptUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  notes: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  approvalLevel: z.enum(['manager', 'director', 'cfo']).optional(),
  urgentExpense: z.boolean().default(false),
  // Steel Industry Specific
  relatedToOrder: z.string().optional(),
  steelGrade: z.string().optional(),
  equipmentId: z.string().optional(),
  maintenanceType: z.enum(['preventive', 'corrective', 'emergency']).optional(),
  // Accounting
  accountingCode: z.string().optional(),
  deductibleExpense: z.boolean().default(true),
  recurringExpense: z.boolean().default(false),
  nextDueDate: z.string().optional(),
})
type ExpenseFormData = z.infer<typeof expenseSchema>
interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: ExpenseFormData) => void | Promise<void>
  defaultValues?: Partial<ExpenseFormData>
}
export function ExpenseDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  defaultValues 
}: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      currency: 'EUR',
      taxRate: 20,
      taxAmount: 0,
      paymentMethod: 'card',
      paymentDate: new Date().toISOString().split('T')[0],
      requiresApproval: false,
      urgentExpense: false,
      deductibleExpense: true,
      recurringExpense: false,
      ...defaultValues,
    },
  })
  const watchAmount = form.watch('amount')
  const watchTaxRate = form.watch('taxRate')
  const watchCategory = form.watch('category')
  const watchRequiresApproval = form.watch('requiresApproval')
  const watchRecurringExpense = form.watch('recurringExpense')
  // Auto-calculate tax amount when amount or tax rate changes
  useEffect(() => {
    if (watchAmount && watchTaxRate) {
      const taxAmount = (watchAmount * watchTaxRate) / 100
      form.setValue('taxAmount', parseFloat(taxAmount.toFixed(2)))
    }
  }, [watchAmount, watchTaxRate, form])
  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Add calculated total amount including tax
      const enrichedData = {
        ...data,
        totalAmount: data.amount + data.taxAmount,
        createdAt: new Date().toISOString(),
        status: data.requiresApproval ? 'pending_approval' : 'approved',
      }
      await onSubmit?.(enrichedData as ExpenseFormData)
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
  const getSubcategoriesByCategory = (category: string) => {
    const subcategories: Record<string, string[]> = {
      materials: ['Acier', 'Alliages', 'Consommables', 'Outillage'],
      equipment: ['Machines', 'Équipement de sécurité', 'Maintenance', 'Calibrage'],
      transport: ['Carburant', 'Péages', 'Livraisons', 'Transport personnel'],
      maintenance: ['Préventive', 'Corrective', 'Urgence', 'Pièces détachées'],
      utilities: ['Électricité', 'Gaz', 'Eau', 'Télécommunications'],
      office: ['Fournitures', 'Logiciels', 'Équipement informatique'],
      marketing: ['Publicité', 'Événements', 'Communication'],
      professional_services: ['Conseil', 'Audit', 'Formation', 'Juridique'],
      insurance: ['RC', 'Matériel', 'Transport', 'Personnel'],
      taxes: ['Taxes locales', 'Redevances', 'Contributions'],
      other: ['Divers', 'Exceptionnel']
    }
    return subcategories[category] || []
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Enregistrer une dépense</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Titre de la dépense *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Achat matières premières" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner la catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="materials">Matières premières</SelectItem>
                            <SelectItem value="equipment">Équipement</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="utilities">Services publics</SelectItem>
                            <SelectItem value="office">Bureau</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="professional_services">Services professionnels</SelectItem>
                            <SelectItem value="insurance">Assurance</SelectItem>
                            <SelectItem value="taxes">Taxes</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchCategory && (
                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sous-catégorie</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner la sous-catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getSubcategoriesByCategory(watchCategory).map((sub) => (
                                <SelectItem key={sub} value={sub.toLowerCase()}>{sub}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Détails de la dépense..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations financières</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant HT (€) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux TVA (%)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseFloat(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Taux TVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5.5">5,5%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant TVA (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            readOnly
                            className="bg-gray-50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de paiement</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode de paiement *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Mode de paiement" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Espèces</SelectItem>
                            <SelectItem value="card">Carte bancaire</SelectItem>
                            <SelectItem value="transfer">Virement</SelectItem>
                            <SelectItem value="check">Chèque</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de reçu/facture</FormLabel>
                        <FormControl>
                          <Input placeholder="N° reçu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiptUrl"
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>URL du reçu/justificatif</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations fournisseur</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="supplierName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nom du fournisseur *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du fournisseur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email du fournisseur</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@fournisseur.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone du fournisseur</FormLabel>
                        <FormControl>
                          <Input placeholder="01 23 45 67 89" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Adresse du fournisseur</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Adresse complète..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Project and Cost Center */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Affectation</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code projet</FormLabel>
                        <FormControl>
                          <Input placeholder="PRJ-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="costCenter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Centre de coût</FormLabel>
                        <FormControl>
                          <Input placeholder="CC-PROD-01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Département</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Département" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="sales">Commercial</SelectItem>
                            <SelectItem value="administration">Administration</SelectItem>
                            <SelectItem value="logistics">Logistique</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Steel Industry Specific */}
              {(watchCategory === 'materials' || watchCategory === 'equipment' || watchCategory === 'maintenance') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spécifique sidérurgie</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {watchCategory === 'materials' && (
                      <FormField
                        control={form.control}
                        name="steelGrade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nuance d'acier</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: S355, S235..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="relatedToOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commande liée</FormLabel>
                          <FormControl>
                            <Input placeholder="N° commande" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {(watchCategory === 'equipment' || watchCategory === 'maintenance') && (
                      <>
                        <FormField
                          control={form.control}
                          name="equipmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Équipement</FormLabel>
                              <FormControl>
                                <Input placeholder="EQ-001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maintenanceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type de maintenance</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="preventive">Préventive</SelectItem>
                                  <SelectItem value="corrective">Corrective</SelectItem>
                                  <SelectItem value="emergency">Urgence</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* Approval and Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validation et options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="requiresApproval"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Nécessite une validation
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="urgentExpense"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Dépense urgente
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  {watchRequiresApproval && (
                    <FormField
                      control={form.control}
                      name="approvalLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau de validation</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="max-w-xs">
                                <SelectValue placeholder="Niveau" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="director">Directeur</SelectItem>
                              <SelectItem value="cfo">Directeur financier</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="deductibleExpense"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Dépense déductible
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recurringExpense"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Dépense récurrente
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  {watchRecurringExpense && (
                    <FormField
                      control={form.control}
                      name="nextDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prochaine échéance</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="accountingCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code comptable</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 601000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes complémentaires</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes internes, informations complémentaires..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Enregistrement en cours...' : 'Enregistrer la dépense'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
