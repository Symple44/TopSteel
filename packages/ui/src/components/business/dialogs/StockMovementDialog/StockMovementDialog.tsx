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

// Stock movement validation schema
const stockMovementSchema = z.object({
  // Movement Type
  movementType: z.enum([
    'inbound',
    'outbound',
    'transfer',
    'production',
    'consumption',
    'adjustment',
  ]),
  transactionType: z.enum([
    'purchase',
    'sale',
    'return',
    'scrap',
    'transfer',
    'production_input',
    'production_output',
    'adjustment',
    'other',
  ]),
  // Material Information
  materialId: z.string().min(1, "L'ID du matériau est requis"),
  materialName: z.string().min(1, 'Le nom du matériau est requis'),
  materialCategory: z.enum(['steel', 'alloy', 'tools', 'consumables', 'equipment', 'other']),
  steelGrade: z.string().optional(),
  dimensions: z.string().optional(),
  // Quantity Information
  quantity: z.number().min(0.01, 'La quantité doit être supérieure à 0'),
  unit: z.enum(['kg', 'tons', 'pieces', 'meters', 'liters', 'boxes']),
  unitCost: z.number().min(0, 'Le coût unitaire doit être positif').optional(),
  totalValue: z.number().optional(),
  currency: z.string().default('EUR'),
  // Location Information
  sourceWarehouseId: z.string().optional(),
  sourceWarehouseName: z.string().optional(),
  sourceLocation: z.string().optional(),
  destinationWarehouseId: z.string().min(1, "L'entrepôt de destination est requis"),
  destinationWarehouseName: z.string().min(1, "Le nom de l'entrepôt de destination est requis"),
  destinationLocation: z.string().optional(),
  binLocation: z.string().optional(),
  // Documentation and References
  referenceNumber: z.string().min(1, 'Le numéro de référence est requis'),
  relatedOrderId: z.string().optional(),
  relatedInvoiceId: z.string().optional(),
  deliveryNoteNumber: z.string().optional(),
  supplierReference: z.string().optional(),
  customerReference: z.string().optional(),
  // Date and Time
  movementDate: z.string().min(1, 'La date de mouvement est requise'),
  expectedDate: z.string().optional(),
  // Personnel and Approval
  initiatedBy: z.string().min(1, "L'initiateur est requis"),
  approvedBy: z.string().optional(),
  receivedBy: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  // Quality and Inspection
  qualityGrade: z.enum(['A', 'B', 'C', 'defective', 'scrap']).optional(),
  inspectionRequired: z.boolean().default(false),
  inspectedBy: z.string().optional(),
  qualityNotes: z.string().optional(),
  // Steel Industry Specific
  heatNumber: z.string().optional(),
  millTestCertificate: z.string().optional(),
  certificationUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  chemicalComposition: z.string().optional(),
  mechanicalProperties: z.string().optional(),
  // Production Information (if applicable)
  productionOrderId: z.string().optional(),
  workOrderId: z.string().optional(),
  machineId: z.string().optional(),
  processStep: z.string().optional(),
  yieldPercentage: z.number().min(0).max(100).optional(),
  // Transportation
  carrierId: z.string().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  vehicleId: z.string().optional(),
  // Cost and Accounting
  accountingCode: z.string().optional(),
  costCenter: z.string().optional(),
  projectId: z.string().optional(),
  // Documentation
  attachments: z.array(z.string().url()).optional(),
  photos: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
  // System Fields
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z
    .enum(['draft', 'pending', 'approved', 'in_transit', 'received', 'completed', 'cancelled'])
    .default('draft'),
})
type StockMovementFormData = z.infer<typeof stockMovementSchema>
interface StockMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: StockMovementFormData) => void | Promise<void>
  defaultValues?: Partial<StockMovementFormData>
}
export function StockMovementDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: StockMovementDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      movementType: 'inbound',
      transactionType: 'purchase',
      materialCategory: 'steel',
      unit: 'kg',
      currency: 'EUR',
      movementDate: new Date().toISOString().split('T')[0],
      initiatedBy: 'Utilisateur actuel', // Should be replaced with actual user
      requiresApproval: false,
      inspectionRequired: false,
      priority: 'medium',
      status: 'draft',
      ...defaultValues,
    },
  })
  const watchMovementType = form.watch('movementType')
  const watchMaterialCategory = form.watch('materialCategory')
  const watchTransactionType = form.watch('transactionType')
  const watchQuantity = form.watch('quantity')
  const watchUnitCost = form.watch('unitCost')
  const watchRequiresApproval = form.watch('requiresApproval')
  const watchInspectionRequired = form.watch('inspectionRequired')
  // Auto-calculate total value
  useEffect(() => {
    if (watchQuantity && watchUnitCost) {
      const totalValue = watchQuantity * watchUnitCost
      form.setValue('totalValue', parseFloat(totalValue.toFixed(2)))
    }
  }, [watchQuantity, watchUnitCost, form])
  const handleSubmit = async (data: StockMovementFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Enrich data with calculated values
      const enrichedData = {
        ...data,
        movementId: `MOV-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isInbound: data.movementType === 'inbound',
        isOutbound: data.movementType === 'outbound',
        needsTransportation: data.sourceWarehouseId !== data.destinationWarehouseId,
      }
      await onSubmit?.(enrichedData as StockMovementFormData)
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
  const getTransactionOptions = (movementType: string) => {
    const options: Record<string, { value: string; label: string }[]> = {
      inbound: [
        { value: 'purchase', label: 'Achat' },
        { value: 'return', label: 'Retour client' },
        { value: 'production_output', label: 'Sortie de production' },
        { value: 'transfer', label: 'Transfert entrant' },
        { value: 'adjustment', label: 'Ajustement positif' },
        { value: 'other', label: 'Autre' },
      ],
      outbound: [
        { value: 'sale', label: 'Vente' },
        { value: 'return', label: 'Retour fournisseur' },
        { value: 'production_input', label: 'Entrée en production' },
        { value: 'transfer', label: 'Transfert sortant' },
        { value: 'scrap', label: 'Mise au rebut' },
        { value: 'adjustment', label: 'Ajustement négatif' },
        { value: 'other', label: 'Autre' },
      ],
      transfer: [{ value: 'transfer', label: 'Transfert inter-entrepôts' }],
      production: [
        { value: 'production_input', label: 'Consommation' },
        { value: 'production_output', label: 'Production' },
      ],
      consumption: [
        { value: 'production_input', label: 'Consommation' },
        { value: 'scrap', label: 'Rebut' },
      ],
      adjustment: [{ value: 'adjustment', label: "Ajustement d'inventaire" }],
    }
    return options[movementType] || []
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Mouvement de stock</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* Movement Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Type de mouvement</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="movementType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de mouvement *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inbound">Entrée</SelectItem>
                            <SelectItem value="outbound">Sortie</SelectItem>
                            <SelectItem value="transfer">Transfert</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                            <SelectItem value="consumption">Consommation</SelectItem>
                            <SelectItem value="adjustment">Ajustement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de transaction *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Transaction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getTransactionOptions(watchMovementType).map((option) => (
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
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>N° de référence *</FormLabel>
                        <FormControl>
                          <Input placeholder="REF-2024-001" {...field} />
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
                  <CardTitle className="text-lg">Matériau</CardTitle>
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
                </CardContent>
              </Card>
              {/* Quantity and Cost */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quantité et coût</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité *</FormLabel>
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
                </CardContent>
              </Card>
              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Localisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(watchMovementType === 'transfer' || watchMovementType === 'outbound') && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="sourceWarehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entrepôt source</FormLabel>
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
                            <FormLabel>Nom entrepôt source</FormLabel>
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
                          <FormItem className="md:col-span-2">
                            <FormLabel>Emplacement source</FormLabel>
                            <FormControl>
                              <Input placeholder="Zone A, Allée 1, A1-15-C" {...field} />
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
                      name="destinationWarehouseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entrepôt destination *</FormLabel>
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
                          <FormLabel>Zone destination</FormLabel>
                          <FormControl>
                            <Input placeholder="Zone B, Allée 2" {...field} />
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
                            <Input placeholder="B2-08-A" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* References and Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Références et documentation</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="relatedOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commande liée</FormLabel>
                        <FormControl>
                          <Input placeholder="ORD-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relatedInvoiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facture liée</FormLabel>
                        <FormControl>
                          <Input placeholder="INV-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryNoteNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>N° bon de livraison</FormLabel>
                        <FormControl>
                          <Input placeholder="BL-2024-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="supplierReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référence fournisseur</FormLabel>
                        <FormControl>
                          <Input placeholder="REF-SUPPLIER-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référence client</FormLabel>
                        <FormControl>
                          <Input placeholder="REF-CLIENT-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="movementDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date du mouvement *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date prévue</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                      name="initiatedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initié par *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom utilisateur" {...field} />
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
                            <Input placeholder="Nom réceptionnaire" {...field} />
                          </FormControl>
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
                      name="inspectionRequired"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Inspection requise</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  {watchRequiresApproval && (
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
                  )}
                  {watchInspectionRequired && (
                    <>
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
                      <FormField
                        control={form.control}
                        name="qualityGrade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade qualité</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="max-w-xs">
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
                        name="qualityNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes qualité</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Observations qualité..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
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
                      name="chemicalComposition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Composition chimique</FormLabel>
                          <FormControl>
                            <Textarea placeholder="C: 0.15%, Mn: 1.20%, Si: 0.25%..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mechanicalProperties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Propriétés mécaniques</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Résistance: 500 MPa, Limite élastique: 355 MPa..."
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
              {/* Production Information */}
              {(watchTransactionType === 'production_input' ||
                watchTransactionType === 'production_output') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations production</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="productionOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordre de production</FormLabel>
                          <FormControl>
                            <Input placeholder="PO-2024-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="workOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordre de travail</FormLabel>
                          <FormControl>
                            <Input placeholder="WO-2024-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="machineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machine/Équipement</FormLabel>
                          <FormControl>
                            <Input placeholder="MACHINE-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="processStep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Étape du processus</FormLabel>
                          <FormControl>
                            <Input placeholder="Découpe, Usinage, Assemblage..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="yieldPercentage"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Rendement (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="95.5"
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
                  </CardContent>
                </Card>
              )}
              {/* Transportation */}
              {(watchMovementType === 'transfer' ||
                watchTransactionType === 'purchase' ||
                watchTransactionType === 'sale') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transport</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
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
                  </CardContent>
                </Card>
              )}
              {/* Cost and Accounting */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comptabilité et affectation</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
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
                            placeholder="Informations complémentaires sur ce mouvement de stock..."
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
                  {loading ? 'Enregistrement en cours...' : 'Enregistrer le mouvement'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
