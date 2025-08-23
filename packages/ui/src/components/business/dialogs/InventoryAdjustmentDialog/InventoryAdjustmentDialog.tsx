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
// Inventory adjustment validation schema
const inventoryAdjustmentSchema = z.object({
  // Material Information
  materialId: z.string().min(1, 'L\'ID du matériau est requis'),
  materialName: z.string().min(1, 'Le nom du matériau est requis'),
  materialCategory: z.enum(['steel', 'alloy', 'tools', 'consumables', 'equipment', 'other']),
  steelGrade: z.string().optional(),
  dimensions: z.string().optional(),
  // Location Information
  warehouseId: z.string().min(1, 'L\'entrepôt est requis'),
  warehouseName: z.string().min(1, 'Le nom de l\'entrepôt est requis'),
  location: z.string().optional(),
  binLocation: z.string().optional(),
  // Adjustment Details
  adjustmentType: z.enum(['increase', 'decrease', 'set_to_value', 'recount']),
  currentQuantity: z.number().min(0, 'La quantité actuelle doit être positive'),
  adjustmentQuantity: z.number({
    required_error: 'La quantité d\'ajustement est requise',
  }),
  newQuantity: z.number().min(0, 'La nouvelle quantité doit être positive'),
  unit: z.enum(['kg', 'tons', 'pieces', 'meters', 'liters', 'boxes']),
  // Reason and Documentation
  reason: z.enum([
    'physical_count',
    'damaged_goods',
    'shrinkage',
    'theft',
    'production_waste',
    'supplier_error',
    'system_error',
    'quality_issue',
    'obsolete_stock',
    'found_stock',
    'other'
  ]),
  reasonDetails: z.string().min(1, 'Les détails de la raison sont requis'),
  // Financial Impact
  unitCost: z.number().min(0, 'Le coût unitaire doit être positif').optional(),
  totalCostImpact: z.number().optional(),
  currency: z.string().default('EUR'),
  // Quality Information
  qualityGrade: z.enum(['A', 'B', 'C', 'defective', 'scrap']).optional(),
  qualityNotes: z.string().optional(),
  requiresQualityCheck: z.boolean().default(false),
  // Approval and Tracking
  adjustmentDate: z.string().min(1, 'La date d\'ajustement est requise'),
  adjustedBy: z.string().min(1, 'L\'utilisateur est requis'),
  approvedBy: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  // Steel Industry Specific
  heatNumber: z.string().optional(),
  millTestCertificate: z.string().optional(),
  certificationUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  // Audit Trail
  previousAdjustmentId: z.string().optional(),
  batchNumber: z.string().optional(),
  cycleCountDate: z.string().optional(),
  // Documentation
  attachments: z.array(z.string().url()).optional(),
  photos: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
  // System Fields
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
})
type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentSchema>
interface InventoryAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: InventoryAdjustmentFormData) => void | Promise<void>
  defaultValues?: Partial<InventoryAdjustmentFormData>
}
export function InventoryAdjustmentDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: InventoryAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      materialCategory: 'steel',
      adjustmentType: 'set_to_value',
      unit: 'kg',
      currency: 'EUR',
      adjustmentDate: new Date().toISOString().split('T')[0],
      adjustedBy: 'Utilisateur actuel', // Should be replaced with actual user
      requiresApproval: false,
      requiresQualityCheck: false,
      priority: 'medium',
      followUpRequired: false,
      ...defaultValues,
    },
  })
  const watchAdjustmentType = form.watch('adjustmentType')
  const watchCurrentQuantity = form.watch('currentQuantity')
  const watchAdjustmentQuantity = form.watch('adjustmentQuantity')
  const watchUnitCost = form.watch('unitCost')
  const watchRequiresApproval = form.watch('requiresApproval')
  const watchFollowUpRequired = form.watch('followUpRequired')
  const watchMaterialCategory = form.watch('materialCategory')
  // Auto-calculate new quantity based on adjustment type
  useEffect(() => {
    if (watchCurrentQuantity !== undefined && watchAdjustmentQuantity !== undefined) {
      let newQuantity = 0
      switch (watchAdjustmentType) {
        case 'increase':
          newQuantity = watchCurrentQuantity + watchAdjustmentQuantity
          break
        case 'decrease':
          newQuantity = Math.max(0, watchCurrentQuantity - watchAdjustmentQuantity)
          break
        case 'set_to_value':
          newQuantity = watchAdjustmentQuantity
          break
        case 'recount':
          newQuantity = watchAdjustmentQuantity
          break
      }
      form.setValue('newQuantity', newQuantity)
      // Calculate cost impact
      if (watchUnitCost) {
        const quantityDifference = newQuantity - watchCurrentQuantity
        const costImpact = quantityDifference * watchUnitCost
        form.setValue('totalCostImpact', parseFloat(costImpact.toFixed(2)))
      }
    }
  }, [watchAdjustmentType, watchCurrentQuantity, watchAdjustmentQuantity, watchUnitCost, form])
  const handleSubmit = async (data: InventoryAdjustmentFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Enrich data with calculated values
      const enrichedData = {
        ...data,
        quantityDifference: data.newQuantity - data.currentQuantity,
        adjustmentPercent: data.currentQuantity > 0 
          ? ((data.newQuantity - data.currentQuantity) / data.currentQuantity * 100)
          : 0,
        adjustmentId: `ADJ-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: data.requiresApproval ? 'pending_approval' : 'approved',
      }
      await onSubmit?.(enrichedData as InventoryAdjustmentFormData)
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
  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      physical_count: 'Inventaire physique',
      damaged_goods: 'Marchandises endommagées',
      shrinkage: 'Démarque',
      theft: 'Vol',
      production_waste: 'Déchet de production',
      supplier_error: 'Erreur fournisseur',
      system_error: 'Erreur système',
      quality_issue: 'Problème qualité',
      obsolete_stock: 'Stock obsolète',
      found_stock: 'Stock retrouvé',
      other: 'Autre'
    }
    return reasons[reason] || reason
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Ajustement d'inventaire</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {/* Material Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Matériau concerné</CardTitle>
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
              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Localisation</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Entrepôt *</FormLabel>
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
                        <FormLabel>Nom de l'entrepôt *</FormLabel>
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
                </CardContent>
              </Card>
              {/* Adjustment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Détails de l'ajustement</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="adjustmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type d'ajustement *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="increase">Augmentation</SelectItem>
                            <SelectItem value="decrease">Diminution</SelectItem>
                            <SelectItem value="set_to_value">Définir la valeur</SelectItem>
                            <SelectItem value="recount">Recomptage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité actuelle *</FormLabel>
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
                    name="adjustmentQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchAdjustmentType === 'increase' && 'Quantité à ajouter *'}
                          {watchAdjustmentType === 'decrease' && 'Quantité à retirer *'}
                          {(watchAdjustmentType === 'set_to_value' || watchAdjustmentType === 'recount') && 'Nouvelle quantité *'}
                        </FormLabel>
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
                    name="newQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantité finale</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            readOnly
                            className="bg-gray-50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adjustmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d'ajustement *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Reason and Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Motif et justification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motif de l'ajustement *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le motif" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="physical_count">Inventaire physique</SelectItem>
                            <SelectItem value="damaged_goods">Marchandises endommagées</SelectItem>
                            <SelectItem value="shrinkage">Démarque</SelectItem>
                            <SelectItem value="theft">Vol</SelectItem>
                            <SelectItem value="production_waste">Déchet de production</SelectItem>
                            <SelectItem value="supplier_error">Erreur fournisseur</SelectItem>
                            <SelectItem value="system_error">Erreur système</SelectItem>
                            <SelectItem value="quality_issue">Problème qualité</SelectItem>
                            <SelectItem value="obsolete_stock">Stock obsolète</SelectItem>
                            <SelectItem value="found_stock">Stock retrouvé</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reasonDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Détails du motif *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez en détail la raison de cet ajustement..."
                            className="min-h-[100px]"
                            {...field}
                          />
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
                            <SelectTrigger className="max-w-xs">
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
                </CardContent>
              </Card>
              {/* Financial Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Impact financier</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
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
                    name="totalCostImpact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact total (€)</FormLabel>
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
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Devise</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Devise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Quality Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations qualité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      name="requiresQualityCheck"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0 pt-8">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Contrôle qualité requis
                          </FormLabel>
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
                          <Textarea
                            placeholder="Observations sur la qualité du matériau..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  </CardContent>
                </Card>
              )}
              {/* Audit Trail */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Traçabilité et validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="adjustedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ajusté par *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom de l'utilisateur" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de lot</FormLabel>
                          <FormControl>
                            <Input placeholder="BATCH-001" {...field} />
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
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Validation requise
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="followUpRequired"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Suivi requis
                          </FormLabel>
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
                  {watchFollowUpRequired && (
                    <FormField
                      control={form.control}
                      name="followUpDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de suivi</FormLabel>
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
                    name="cycleCountDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date dernier inventaire</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                            placeholder="Informations complémentaires..."
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
                  {loading ? 'Ajustement en cours...' : 'Confirmer l\'ajustement'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
