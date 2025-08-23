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
// Low stock alert validation schema
const lowStockAlertSchema = z.object({
  // Alert Configuration
  alertName: z.string().min(1, 'Le nom de l\'alerte est requis'),
  alertDescription: z.string().optional(),
  alertType: z.enum(['threshold', 'days_of_supply', 'critical_level', 'custom']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  // Material Information
  materialId: z.string().min(1, 'L\'ID du matériau est requis'),
  materialName: z.string().min(1, 'Le nom du matériau est requis'),
  materialCategory: z.enum(['steel', 'alloy', 'tools', 'consumables', 'equipment', 'other']),
  steelGrade: z.string().optional(),
  specificGrades: z.array(z.string()).optional(),
  // Location Configuration
  warehouseId: z.string().optional(),
  warehouseName: z.string().optional(),
  location: z.string().optional(),
  binLocation: z.string().optional(),
  applyToAllLocations: z.boolean().default(false),
  // Threshold Configuration
  currentStock: z.number().min(0, 'Le stock actuel doit être positif'),
  minimumStock: z.number().min(0, 'Le stock minimum doit être positif'),
  reorderPoint: z.number().min(0, 'Le point de commande doit être positif'),
  maximumStock: z.number().min(0, 'Le stock maximum doit être positif').optional(),
  safetyStock: z.number().min(0, 'Le stock de sécurité doit être positif').optional(),
  unit: z.enum(['kg', 'tons', 'pieces', 'meters', 'liters', 'boxes']),
  // Automatic Reorder Configuration
  enableAutoReorder: z.boolean().default(false),
  reorderQuantity: z.number().min(0, 'La quantité de réapprovisionnement doit être positive').optional(),
  economicOrderQuantity: z.number().min(0, 'La quantité économique de commande doit être positive').optional(),
  leadTimeInDays: z.number().min(0, 'Le délai d\'approvisionnement doit être positif').optional(),
  preferredSupplierId: z.string().optional(),
  preferredSupplierName: z.string().optional(),
  // Days of Supply Calculation
  averageDailyUsage: z.number().min(0, 'La consommation journalière moyenne doit être positive').optional(),
  daysOfSupplyThreshold: z.number().min(0, 'Le seuil en jours de stock doit être positif').optional(),
  seasonalAdjustment: z.boolean().default(false),
  seasonalFactor: z.number().min(0.1).max(10, 'Le facteur saisonnier doit être entre 0.1 et 10').optional(),
  // Cost and Financial Impact
  unitCost: z.number().min(0, 'Le coût unitaire doit être positif').optional(),
  totalValue: z.number().optional(),
  currency: z.string().default('EUR'),
  stockoutCost: z.number().min(0, 'Le coût de rupture doit être positif').optional(),
  carryingCost: z.number().min(0, 'Le coût de possession doit être positif').optional(),
  // Alert Frequency and Timing
  alertFrequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']).default('immediate'),
  operatingHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    workingDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
  }).optional(),
  // Notification Configuration
  notificationMethods: z.array(z.enum(['email', 'sms', 'push', 'dashboard', 'webhook'])).min(1, 'Au moins une méthode de notification est requise'),
  recipients: z.array(z.object({
    type: z.enum(['user', 'role', 'department', 'email']),
    value: z.string().min(1, 'La valeur du destinataire est requise'),
    name: z.string().optional(),
  })).min(1, 'Au moins un destinataire est requis'),
  escalationLevel: z.enum(['none', 'supervisor', 'manager', 'director']).default('none'),
  escalationDelay: z.number().min(0, 'Le délai d\'escalade doit être positif').optional(), // in hours
  // Advanced Configuration
  considerInTransit: z.boolean().default(true),
  considerReserved: z.boolean().default(true),
  considerQualityHold: z.boolean().default(false),
  excludeWeekends: z.boolean().default(false),
  excludeHolidays: z.boolean().default(false),
  // Business Rules
  businessRules: z.array(z.object({
    condition: z.string().min(1, 'La condition est requise'),
    action: z.enum(['increase_threshold', 'decrease_threshold', 'trigger_urgent', 'skip_alert', 'change_supplier']),
    value: z.number().optional(),
    description: z.string().optional(),
  })).optional(),
  // Approval and Workflow
  requiresApproval: z.boolean().default(false),
  autoApproveUnder: z.number().min(0, 'Le montant d\'approbation automatique doit être positif').optional(),
  approvalWorkflow: z.array(z.object({
    level: z.number().min(1),
    role: z.string().min(1, 'Le rôle est requis'),
    condition: z.string().optional(),
  })).optional(),
  // Performance and Monitoring
  trackAccuracy: z.boolean().default(true),
  alertHistory: z.boolean().default(true),
  performanceMetrics: z.boolean().default(true),
  // System Configuration
  isActive: z.boolean().default(true),
  validFrom: z.string().min(1, 'La date de début est requise'),
  validTo: z.string().optional(),
  timezone: z.string().default('Europe/Paris'),
  // Documentation
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string().url()).optional(),
})
type LowStockAlertFormData = z.infer<typeof lowStockAlertSchema>
interface LowStockAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: LowStockAlertFormData) => void | Promise<void>
  defaultValues?: Partial<LowStockAlertFormData>
}
export function LowStockAlertDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  defaultValues 
}: LowStockAlertDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<LowStockAlertFormData>({
    resolver: zodResolver(lowStockAlertSchema),
    defaultValues: {
      alertType: 'threshold',
      priority: 'medium',
      materialCategory: 'steel',
      unit: 'kg',
      currency: 'EUR',
      applyToAllLocations: false,
      enableAutoReorder: false,
      seasonalAdjustment: false,
      alertFrequency: 'immediate',
      notificationMethods: ['email'],
      recipients: [],
      escalationLevel: 'none',
      considerInTransit: true,
      considerReserved: true,
      considerQualityHold: false,
      excludeWeekends: false,
      excludeHolidays: false,
      requiresApproval: false,
      trackAccuracy: true,
      alertHistory: true,
      performanceMetrics: true,
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      timezone: 'Europe/Paris',
      ...defaultValues,
    },
  })
  const watchAlertType = form.watch('alertType')
  const watchMaterialCategory = form.watch('materialCategory')
  const watchEnableAutoReorder = form.watch('enableAutoReorder')
  const watchSeasonalAdjustment = form.watch('seasonalAdjustment')
  const watchCurrentStock = form.watch('currentStock')
  const watchUnitCost = form.watch('unitCost')
  const watchEscalationLevel = form.watch('escalationLevel')
  const watchRequiresApproval = form.watch('requiresApproval')
  const watchOperatingHours = form.watch('operatingHours')
  // Auto-calculate total value
  useEffect(() => {
    if (watchCurrentStock && watchUnitCost) {
      const totalValue = watchCurrentStock * watchUnitCost
      form.setValue('totalValue', parseFloat(totalValue.toFixed(2)))
    }
  }, [watchCurrentStock, watchUnitCost, form])
  const handleSubmit = async (data: LowStockAlertFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Enrich data with calculated values
      const enrichedData = {
        ...data,
        alertId: `ALERT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isThresholdBased: data.alertType === 'threshold',
        isDaysOfSupplyBased: data.alertType === 'days_of_supply',
        calculatedDaysOfSupply: data.averageDailyUsage && data.currentStock 
          ? Math.floor(data.currentStock / data.averageDailyUsage) 
          : null,
        stockRatio: data.minimumStock > 0 ? (data.currentStock / data.minimumStock) : null,
      }
      await onSubmit?.(enrichedData as LowStockAlertFormData)
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
  const addRecipient = () => {
    const currentRecipients = form.getValues('recipients') || []
    form.setValue('recipients', [
      ...currentRecipients,
      { type: 'email', value: '', name: '' }
    ])
  }
  const removeRecipient = (index: number) => {
    const currentRecipients = form.getValues('recipients') || []
    form.setValue('recipients', currentRecipients.filter((_, i) => i !== index))
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configuration d'alerte stock bas</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* Alert Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration de l'alerte</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="alertName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nom de l'alerte *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Alerte stock acier S355" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="alertType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'alerte *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="threshold">Seuil de stock</SelectItem>
                            <SelectItem value="days_of_supply">Jours de stock</SelectItem>
                            <SelectItem value="critical_level">Niveau critique</SelectItem>
                            <SelectItem value="custom">Personnalisé</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priorité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Priorité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Basse</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="critical">Critique</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="alertDescription"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description de l'alerte..." 
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
              {/* Material Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Matériau surveillé</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="materialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Matériau *</FormLabel>
                        <FormControl>
                          <Input placeholder="MAT-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="materialName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du matériau *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du matériau" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="materialCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="steel">Acier</SelectItem>
                            <SelectItem value="alloy">Alliage</SelectItem>
                            <SelectItem value="tools">Outillage</SelectItem>
                            <SelectItem value="consumables">Consommables</SelectItem>
                            <SelectItem value="equipment">Équipement</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchMaterialCategory === 'steel' && (
                    <FormField
                      control={form.control}
                      name="steelGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nuance d'acier</FormLabel>
                          <FormControl>
                            <Input placeholder="S355, S235..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
              {/* Location Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Localisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="applyToAllLocations"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Appliquer à tous les emplacements
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {!form.watch('applyToAllLocations') && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="warehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Entrepôt</FormLabel>
                            <FormControl>
                              <Input placeholder="WH-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="warehouseName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom de l'entrepôt</FormLabel>
                            <FormControl>
                              <Input placeholder="Entrepôt principal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zone/Allée</FormLabel>
                            <FormControl>
                              <Input placeholder="Zone A, Allée 1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="binLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emplacement précis</FormLabel>
                            <FormControl>
                              <Input placeholder="A1-15-C" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Threshold Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration des seuils</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock actuel *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
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
                    control={form.control}
                    name="minimumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock minimum *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
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
                    control={form.control}
                    name="reorderPoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Point de commande *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
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
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">Kilogrammes</SelectItem>
                            <SelectItem value="tons">Tonnes</SelectItem>
                            <SelectItem value="pieces">Pièces</SelectItem>
                            <SelectItem value="meters">Mètres</SelectItem>
                            <SelectItem value="liters">Litres</SelectItem>
                            <SelectItem value="boxes">Boîtes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maximumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock maximum</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
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
                    control={form.control}
                    name="safetyStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock de sécurité</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Days of Supply Configuration */}
              {(watchAlertType === 'days_of_supply' || watchAlertType === 'custom') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration jours de stock</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="averageDailyUsage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consommation journalière moyenne</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
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
                      control={form.control}
                      name="daysOfSupplyThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seuil en jours de stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="7"
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
                      name="leadTimeInDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Délai d'approvisionnement (jours)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="7"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="seasonalAdjustment"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              Ajustement saisonnier
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      {watchSeasonalAdjustment && (
                        <FormField
                          control={form.control}
                          name="seasonalFactor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facteur saisonnier</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="1.2"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Automatic Reorder Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Réapprovisionnement automatique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="enableAutoReorder"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Activer le réapprovisionnement automatique
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchEnableAutoReorder && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="reorderQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité de réapprovisionnement</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="100"
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
                        name="economicOrderQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantité économique de commande</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="500"
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
                        name="preferredSupplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Fournisseur préféré</FormLabel>
                            <FormControl>
                              <Input placeholder="SUP-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferredSupplierName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du fournisseur préféré</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom du fournisseur" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Cost Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations financières</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût unitaire (€)</FormLabel>
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
                    name="totalValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valeur totale (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            readOnly
                            className="bg-gray-50"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stockoutCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût de rupture (€)</FormLabel>
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
                    name="carryingCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût de possession (€)</FormLabel>
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
                </CardContent>
              </Card>
              {/* Notification Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration des notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="alertFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fréquence d'alerte</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Fréquence" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediate">Immédiate</SelectItem>
                              <SelectItem value="daily">Quotidienne</SelectItem>
                              <SelectItem value="weekly">Hebdomadaire</SelectItem>
                              <SelectItem value="monthly">Mensuelle</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="escalationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Niveau d'escalade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Escalade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Aucune</SelectItem>
                              <SelectItem value="supervisor">Superviseur</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="director">Directeur</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {watchEscalationLevel !== 'none' && (
                    <FormField
                      control={form.control}
                      name="escalationDelay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Délai d'escalade (heures)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="24"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="space-y-2">
                    <FormLabel>Méthodes de notification</FormLabel>
                    <div className="grid gap-2 md:grid-cols-3">
                      {['email', 'sms', 'push', 'dashboard', 'webhook'].map((method) => (
                        <FormField
                          key={method}
                          control={form.control}
                          name="notificationMethods"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value?.includes(method)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, method])
                                    } else {
                                      field.onChange(current.filter(m => m !== method))
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal capitalize">
                                {method}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Destinataires</FormLabel>
                      <Button type="button" onClick={addRecipient} size="sm">
                        Ajouter un destinataire
                      </Button>
                    </div>
                    {form.watch('recipients')?.map((recipient, index) => (
                      <div key={index} className="grid gap-2 md:grid-cols-4 items-end">
                        <FormField
                          control={form.control}
                          name={`recipients.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">Utilisateur</SelectItem>
                                  <SelectItem value="role">Rôle</SelectItem>
                                  <SelectItem value="department">Département</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`recipients.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valeur</FormLabel>
                              <FormControl>
                                <Input placeholder="email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`recipients.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <Input placeholder="Nom" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeRecipient(index)}
                          size="sm"
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {/* Advanced Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration avancée</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="considerInTransit"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Considérer le stock en transit
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="considerReserved"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Considérer le stock réservé
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="considerQualityHold"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Considérer le stock bloqué qualité
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="excludeWeekends"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Exclure les week-ends
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="excludeHolidays"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Exclure les jours fériés
                          </FormLabel>
                        </FormItem>
                      )}
                    />
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
                            Validation des commandes requise
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  {watchRequiresApproval && (
                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="autoApproveUnder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auto-approuver en dessous de (€)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="1000"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* System Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration système</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="validFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valide à partir du *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="validTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valide jusqu'au</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuseau horaire</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Fuseau horaire" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Alerte active
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Performance Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suivi des performances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="trackAccuracy"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Suivre la précision
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="alertHistory"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Historique des alertes
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="performanceMetrics"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Métriques de performance
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes complémentaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes sur cette configuration d'alerte..."
                            className="min-h-[100px]"
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
                  {loading ? 'Configuration en cours...' : 'Configurer l\'alerte'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
