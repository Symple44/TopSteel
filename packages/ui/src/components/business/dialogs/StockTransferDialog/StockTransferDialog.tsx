'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '../../../layout/card/Card'
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

// Stock transfer validation schema
const stockTransferSchema = z.object({
  // Transfer Information
  transferNumber: z.string().min(1, 'Le numéro de transfert est requis'),
  transferType: z.enum(['internal', 'external', 'production', 'maintenance', 'emergency']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  // Source Information
  sourceWarehouseId: z.string().min(1, "L'entrepôt source est requis"),
  sourceWarehouseName: z.string().min(1, "Le nom de l'entrepôt source est requis"),
  sourceLocation: z.string().optional(),
  sourceBinLocation: z.string().optional(),
  sourceContactPerson: z.string().optional(),
  // Destination Information
  destinationWarehouseId: z.string().min(1, "L'entrepôt de destination est requis"),
  destinationWarehouseName: z.string().min(1, "Le nom de l'entrepôt de destination est requis"),
  destinationLocation: z.string().optional(),
  destinationBinLocation: z.string().optional(),
  destinationContactPerson: z.string().optional(),
  // Material Information
  materialId: z.string().min(1, "L'ID du matériau est requis"),
  materialName: z.string().min(1, 'Le nom du matériau est requis'),
  materialCategory: z.enum(['steel', 'alloy', 'tools', 'consumables', 'equipment', 'other']),
  steelGrade: z.string().optional(),
  dimensions: z.string().optional(),
  lotNumber: z.string().optional(),
  serialNumbers: z.array(z.string()).optional(),
  // Quantity Information
  requestedQuantity: z.number().min(0.01, 'La quantité demandée doit être supérieure à 0'),
  availableQuantity: z.number().min(0, 'La quantité disponible doit être positive').optional(),
  transferQuantity: z.number().min(0.01, 'La quantité à transférer doit être supérieure à 0'),
  unit: z.enum(['kg', 'tons', 'pieces', 'meters', 'liters', 'boxes']),
  unitValue: z.number().min(0, 'La valeur unitaire doit être positive').optional(),
  totalValue: z.number().optional(),
  currency: z.string().default('EUR'),
  // Dates
  transferDate: z.string().min(1, 'La date de transfert est requise'),
  requestedDate: z.string().min(1, 'La date demandée est requise'),
  expectedDeliveryDate: z.string().optional(),
  actualDeliveryDate: z.string().optional(),
  // Personnel
  requestedBy: z.string().min(1, 'Le demandeur est requis'),
  approvedBy: z.string().optional(),
  preparedBy: z.string().optional(),
  shippedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  // Transfer Status and Workflow
  status: z
    .enum([
      'draft',
      'requested',
      'approved',
      'rejected',
      'preparing',
      'in_transit',
      'delivered',
      'completed',
      'cancelled',
    ])
    .default('draft'),
  requiresApproval: z.boolean().default(false),
  approvalLevel: z.enum(['supervisor', 'manager', 'director']).optional(),
  // Business Justification
  reason: z.enum([
    'production_need',
    'stock_rebalancing',
    'emergency_supply',
    'maintenance_repair',
    'customer_order',
    'quality_segregation',
    'obsolete_movement',
    'cost_optimization',
    'seasonal_adjustment',
    'other',
  ]),
  reasonDetails: z.string().min(1, 'Les détails de la raison sont requis'),
  businessImpact: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  // Quality and Inspection
  qualityCheckRequired: z.boolean().default(false),
  qualityGrade: z.enum(['A', 'B', 'C', 'defective', 'scrap']).optional(),
  inspectedBy: z.string().optional(),
  qualityNotes: z.string().optional(),
  packagingCondition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']).optional(),
  // Transportation
  transportMethod: z
    .enum(['internal', 'external_carrier', 'customer_pickup', 'direct_delivery'])
    .default('internal'),
  carrierId: z.string().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  vehicleId: z.string().optional(),
  driverName: z.string().optional(),
  estimatedTransitTime: z.number().min(0).optional(), // in hours
  // Steel Industry Specific
  heatNumber: z.string().optional(),
  millTestCertificate: z.string().optional(),
  certificationUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  chemicalComposition: z.string().optional(),
  mechanicalProperties: z.string().optional(),
  surfaceCondition: z.string().optional(),
  // Cost and Accounting
  transferCost: z.number().min(0).optional(),
  handlingCost: z.number().min(0).optional(),
  transportationCost: z.number().min(0).optional(),
  totalCost: z.number().optional(),
  accountingCode: z.string().optional(),
  costCenter: z.string().optional(),
  projectId: z.string().optional(),
  // Documentation
  attachments: z.array(z.string().url()).optional(),
  photos: z.array(z.string().url()).optional(),
  deliveryInstructions: z.string().optional(),
  specialHandling: z.string().optional(),
  notes: z.string().optional(),
  // Safety and Compliance
  hazardousMaterial: z.boolean().default(false),
  hazardClass: z.string().optional(),
  safetyRequirements: z.string().optional(),
  complianceNotes: z.string().optional(),
  // System Fields
  urgentTransfer: z.boolean().default(false),
  autoReceive: z.boolean().default(false),
  notifyOnDelivery: z.boolean().default(true),
  trackingEnabled: z.boolean().default(true),
})
type StockTransferFormData = z.infer<typeof stockTransferSchema>
interface StockTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: StockTransferFormData) => void | Promise<void>
  defaultValues?: Partial<StockTransferFormData>
}
export function StockTransferDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: StockTransferDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      transferType: 'internal',
      priority: 'medium',
      materialCategory: 'steel',
      unit: 'kg',
      currency: 'EUR',
      transferDate: new Date().toISOString().split('T')[0],
      requestedDate: new Date().toISOString().split('T')[0],
      requestedBy: 'Utilisateur actuel', // Should be replaced with actual user
      status: 'draft',
      requiresApproval: false,
      reason: 'production_need',
      businessImpact: 'medium',
      qualityCheckRequired: false,
      transportMethod: 'internal',
      hazardousMaterial: false,
      urgentTransfer: false,
      autoReceive: false,
      notifyOnDelivery: true,
      trackingEnabled: true,
      ...defaultValues,
    },
  })
  const watchTransferQuantity = form.watch('transferQuantity')
  const watchUnitValue = form.watch('unitValue')
  const watchMaterialCategory = form.watch('materialCategory')
  const watchRequiresApproval = form.watch('requiresApproval')
  const watchQualityCheckRequired = form.watch('qualityCheckRequired')
  const watchTransportMethod = form.watch('transportMethod')
  const watchHazardousMaterial = form.watch('hazardousMaterial')
  const watchTransferCost = form.watch('transferCost')
  const watchHandlingCost = form.watch('handlingCost')
  const watchTransportationCost = form.watch('transportationCost')
  // Auto-calculate total value
  useEffect(() => {
    if (watchTransferQuantity && watchUnitValue) {
      const totalValue = watchTransferQuantity * watchUnitValue
      form.setValue('totalValue', parseFloat(totalValue.toFixed(2)))
    }
  }, [watchTransferQuantity, watchUnitValue, form])
  // Auto-calculate total cost
  useEffect(() => {
    const costs = [watchTransferCost, watchHandlingCost, watchTransportationCost].filter(
      (cost) => cost && cost > 0
    )
    if (costs.length > 0) {
      const totalCost = costs.reduce((sum, cost) => (sum || 0) + (cost || 0), 0)
      form.setValue('totalCost', parseFloat((totalCost || 0).toFixed(2)))
    }
  }, [watchTransferCost, watchHandlingCost, watchTransportationCost, form])
  const handleSubmit = async (data: StockTransferFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Enrich data with calculated values
      const enrichedData = {
        ...data,
        transferId: `TRF-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isUrgent: data.urgentTransfer,
        isInterWarehouse: data.sourceWarehouseId !== data.destinationWarehouseId,
        estimatedCost: data.totalCost || 0,
        requiresSpecialHandling: data.hazardousMaterial || Boolean(data.specialHandling),
      }
      await onSubmit?.(enrichedData as StockTransferFormData)
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
  const _getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      production_need: 'Besoin de production',
      stock_rebalancing: 'Rééquilibrage de stock',
      emergency_supply: "Approvisionnement d'urgence",
      maintenance_repair: 'Maintenance/Réparation',
      customer_order: 'Commande client',
      quality_segregation: 'Ségrégation qualité',
      obsolete_movement: "Déplacement d'obsolètes",
      cost_optimization: 'Optimisation des coûts',
      seasonal_adjustment: 'Ajustement saisonnier',
      other: 'Autre',
    }
    return reasons[reason] || reason
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Transfert de stock</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* Transfer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations du transfert</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="transferNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>N° de transfert *</FormLabel>
                        <FormControl>
                          <Input placeholder="TRF-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transferType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de transfert *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="internal">Interne</SelectItem>
                            <SelectItem value="external">Externe</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="emergency">Urgence</SelectItem>
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
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Source and Destination */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Source Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Entrepôt source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sourceWarehouseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Entrepôt source *</FormLabel>
                          <FormControl>
                            <Input placeholder="WH-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceWarehouseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom entrepôt source *</FormLabel>
                          <FormControl>
                            <Input placeholder="Entrepôt principal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone/Allée source</FormLabel>
                          <FormControl>
                            <Input placeholder="Zone A, Allée 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceBinLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emplacement précis source</FormLabel>
                          <FormControl>
                            <Input placeholder="A1-15-C" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceContactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact source</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                {/* Destination Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Entrepôt destination</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="destinationWarehouseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Entrepôt destination *</FormLabel>
                          <FormControl>
                            <Input placeholder="WH-002" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationWarehouseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom entrepôt destination *</FormLabel>
                          <FormControl>
                            <Input placeholder="Entrepôt secondaire" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone/Allée destination</FormLabel>
                          <FormControl>
                            <Input placeholder="Zone B, Allée 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationBinLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emplacement précis destination</FormLabel>
                          <FormControl>
                            <Input placeholder="B2-08-A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="destinationContactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact destination</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
              {/* Material Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Matériau à transférer</CardTitle>
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
                  <FormField
                    control={form.control}
                    name="dimensions"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Dimensions/Spécifications</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 10x200x6000mm, Ø50x1000mm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lotNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de lot</FormLabel>
                        <FormControl>
                          <Input placeholder="LOT-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Quantity Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quantités et valeur</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="availableQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité disponible</FormLabel>
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
                    name="requestedQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité demandée *</FormLabel>
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
                    name="transferQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité à transférer *</FormLabel>
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
                    name="unitValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valeur unitaire (€)</FormLabel>
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
                </CardContent>
              </Card>
              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Planning</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="transferDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date du transfert *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="requestedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date demandée *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date prévue livraison</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actualDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date réelle livraison</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Business Justification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Justification métier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motif du transfert *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Motif" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="production_need">Besoin de production</SelectItem>
                              <SelectItem value="stock_rebalancing">
                                Rééquilibrage de stock
                              </SelectItem>
                              <SelectItem value="emergency_supply">
                                Approvisionnement d'urgence
                              </SelectItem>
                              <SelectItem value="maintenance_repair">
                                Maintenance/Réparation
                              </SelectItem>
                              <SelectItem value="customer_order">Commande client</SelectItem>
                              <SelectItem value="quality_segregation">
                                Ségrégation qualité
                              </SelectItem>
                              <SelectItem value="obsolete_movement">
                                Déplacement d'obsolètes
                              </SelectItem>
                              <SelectItem value="cost_optimization">
                                Optimisation des coûts
                              </SelectItem>
                              <SelectItem value="seasonal_adjustment">
                                Ajustement saisonnier
                              </SelectItem>
                              <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessImpact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impact métier</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Impact" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Faible</SelectItem>
                              <SelectItem value="medium">Moyen</SelectItem>
                              <SelectItem value="high">Élevé</SelectItem>
                              <SelectItem value="critical">Critique</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="reasonDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Détails de la justification *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez en détail la raison de ce transfert..."
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
              {/* Personnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personnel et validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="requestedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Demandé par *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du demandeur" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preparedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Préparé par</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du préparateur" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receivedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Réceptionné par</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du réceptionnaire" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="requiresApproval"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Validation requise</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="urgentTransfer"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Transfert urgent</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  {watchRequiresApproval && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="approvalLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Niveau de validation</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Niveau" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="supervisor">Superviseur</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="director">Directeur</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="approvedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validé par</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom du validateur" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Quality Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contrôle qualité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="qualityCheckRequired"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Contrôle qualité requis
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="packagingCondition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>État de l'emballage</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="État" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Bon</SelectItem>
                              <SelectItem value="fair">Correct</SelectItem>
                              <SelectItem value="poor">Mauvais</SelectItem>
                              <SelectItem value="damaged">Endommagé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {watchQualityCheckRequired && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="qualityGrade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grade qualité</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Grade" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="A">A - Excellent</SelectItem>
                                  <SelectItem value="B">B - Bon</SelectItem>
                                  <SelectItem value="C">C - Acceptable</SelectItem>
                                  <SelectItem value="defective">Défectueux</SelectItem>
                                  <SelectItem value="scrap">Rebut</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="inspectedBy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inspecté par</FormLabel>
                              <FormControl>
                                <Input placeholder="Nom de l'inspecteur" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="qualityNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes qualité</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Observations sur la qualité..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
              {/* Transportation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transport</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="transportMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode de transport</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="max-w-xs">
                              <SelectValue placeholder="Mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="internal">Transport interne</SelectItem>
                            <SelectItem value="external_carrier">Transporteur externe</SelectItem>
                            <SelectItem value="customer_pickup">Retrait client</SelectItem>
                            <SelectItem value="direct_delivery">Livraison directe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchTransportMethod === 'external_carrier' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="carrierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Transporteur</FormLabel>
                            <FormControl>
                              <Input placeholder="CARRIER-001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="carrierName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du transporteur</FormLabel>
                            <FormControl>
                              <Input placeholder="Transport Express" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="trackingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>N° de suivi</FormLabel>
                            <FormControl>
                              <Input placeholder="TRK-123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="driverName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du chauffeur</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom du chauffeur" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="vehicleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Véhicule</FormLabel>
                          <FormControl>
                            <Input placeholder="Camion-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estimatedTransitTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temps de transit estimé (heures)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="2"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || undefined)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Steel Industry Specific */}
              {watchMaterialCategory === 'steel' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spécifique sidérurgie</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="heatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de coulée</FormLabel>
                          <FormControl>
                            <Input placeholder="HN-2024-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="millTestCertificate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificat d'essai</FormLabel>
                          <FormControl>
                            <Input placeholder="MTC-2024-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="certificationUrl"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>URL du certificat</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="surfaceCondition"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>État de surface</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description de l'état de surface..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
              {/* Cost and Accounting */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coûts et comptabilité</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="transferCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût transfert (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="handlingCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût manutention (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transportationCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût transport (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coût total (€)</FormLabel>
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
                    name="accountingCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code comptable</FormLabel>
                        <FormControl>
                          <Input placeholder="601000" {...field} />
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
                </CardContent>
              </Card>
              {/* Safety and Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sécurité et conformité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hazardousMaterial"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Matière dangereuse</FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchHazardousMaterial && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="hazardClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Classe de danger</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Classe 8" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="safetyRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exigences de sécurité</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Équipements de protection requis..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="specialHandling"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions de manutention spéciale</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instructions particulières de manutention..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions de livraison</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instructions spécifiques pour la livraison..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* System Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Options système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="autoReceive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Réception automatique
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notifyOnDelivery"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Notification à la livraison
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="trackingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Suivi activé</FormLabel>
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
                            placeholder="Informations complémentaires sur ce transfert..."
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
                  {loading ? 'Création en cours...' : 'Créer le transfert'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
