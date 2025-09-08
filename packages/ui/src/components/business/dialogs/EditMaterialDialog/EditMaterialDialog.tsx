'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms/form/form'
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

// Validation schema for material editing
const materialSchema = z.object({
  reference: z.string().min(1, 'La référence est obligatoire'),
  name: z.string().min(1, 'Le nom est obligatoire'),
  description: z.string().optional(),
  category: z.string().min(1, 'La catégorie est obligatoire'),
  type: z.string().min(1, 'Le type est obligatoire'),
  grade: z.string().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    diameter: z.number().positive().optional(),
    thickness: z.number().positive().optional(),
  }),
  weight: z.number().positive('Le poids doit être positif').optional(),
  unit: z.string().min(1, "L'unité est obligatoire"),
  unitPrice: z.number().positive('Le prix unitaire doit être positif'),
  minStock: z.number().min(0, 'Le stock minimum doit être positif ou nul'),
  maxStock: z.number().positive('Le stock maximum doit être positif').optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  barcode: z.string().optional(),
  properties: z.object({
    tensileStrength: z.number().positive().optional(),
    yieldStrength: z.number().positive().optional(),
    elongation: z.number().positive().optional(),
    hardness: z.number().positive().optional(),
    corrosionResistance: z.string().optional(),
  }),
  isActive: z.boolean().default(true),
  requiresInspection: z.boolean().default(false),
  hazardous: z.boolean().default(false),
  notes: z.string().optional(),
})
type MaterialFormData = z.infer<typeof materialSchema>
interface Material {
  id: string
  reference: string
  name: string
  description?: string
  category: string
  type: string
  grade?: string
  dimensions: {
    length?: number
    width?: number
    height?: number
    diameter?: number
    thickness?: number
  }
  weight?: number
  unit: string
  unitPrice: number
  minStock: number
  maxStock?: number
  supplier?: string
  location?: string
  barcode?: string
  properties: {
    tensileStrength?: number
    yieldStrength?: number
    elongation?: number
    hardness?: number
    corrosionResistance?: string
  }
  isActive: boolean
  requiresInspection: boolean
  hazardous: boolean
  notes?: string
}
interface EditMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: MaterialFormData) => void | Promise<void>
  material?: Material
}
export function EditMaterialDialog({
  open,
  onOpenChange,
  onSubmit,
  material,
}: EditMaterialDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      reference: '',
      name: '',
      description: '',
      category: '',
      type: '',
      grade: '',
      dimensions: {
        length: undefined,
        width: undefined,
        height: undefined,
        diameter: undefined,
        thickness: undefined,
      },
      weight: undefined,
      unit: 'kg',
      unitPrice: 0,
      minStock: 0,
      maxStock: undefined,
      supplier: '',
      location: '',
      barcode: '',
      properties: {
        tensileStrength: undefined,
        yieldStrength: undefined,
        elongation: undefined,
        hardness: undefined,
        corrosionResistance: '',
      },
      isActive: true,
      requiresInspection: false,
      hazardous: false,
      notes: '',
    },
  })
  // Update form when material changes
  useEffect(() => {
    if (material && open) {
      form.reset({
        reference: material.reference,
        name: material.name,
        description: material.description || '',
        category: material.category,
        type: material.type,
        grade: material.grade || '',
        dimensions: material.dimensions,
        weight: material.weight,
        unit: material.unit,
        unitPrice: material.unitPrice,
        minStock: material.minStock,
        maxStock: material.maxStock,
        supplier: material.supplier || '',
        location: material.location || '',
        barcode: material.barcode || '',
        properties: material.properties,
        isActive: material.isActive,
        requiresInspection: material.requiresInspection,
        hazardous: material.hazardous,
        notes: material.notes || '',
      })
    }
  }, [material, open, form])
  const handleSubmit = async (data: MaterialFormData) => {
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
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier un matériau</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations générales</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Référence *</FormLabel>
                      <FormControl>
                        <Input placeholder="REF-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du matériau" {...field} />
                      </FormControl>
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
                      <Textarea placeholder="Description du matériau" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="acier">Acier</SelectItem>
                          <SelectItem value="aluminium">Aluminium</SelectItem>
                          <SelectItem value="inox">Inox</SelectItem>
                          <SelectItem value="fonte">Fonte</SelectItem>
                          <SelectItem value="laiton">Laiton</SelectItem>
                          <SelectItem value="cuivre">Cuivre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="barre">Barre</SelectItem>
                          <SelectItem value="tole">Tôle</SelectItem>
                          <SelectItem value="tube">Tube</SelectItem>
                          <SelectItem value="profil">Profilé</SelectItem>
                          <SelectItem value="fil">Fil</SelectItem>
                          <SelectItem value="plaque">Plaque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuance</FormLabel>
                      <FormControl>
                        <Input placeholder="S235JR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Dimensions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dimensions</h3>
              <div className="grid grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="dimensions.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longueur (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Largeur (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hauteur (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.diameter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diamètre (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="25"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.thickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Épaisseur (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="2.5"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Pricing & Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Prix et Stock</h3>
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poids (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="7.85"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">Kilogramme</SelectItem>
                          <SelectItem value="t">Tonne</SelectItem>
                          <SelectItem value="m">Mètre</SelectItem>
                          <SelectItem value="m2">Mètre carré</SelectItem>
                          <SelectItem value="piece">Pièce</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix unitaire (€) *</FormLabel>
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
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fournisseur</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du fournisseur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock minimum *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock maximum</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value, 10) : undefined
                            )
                          }
                        />
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
                      <FormLabel>Emplacement</FormLabel>
                      <FormControl>
                        <Input placeholder="Zone A-1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code-barres</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Technical Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Propriétés techniques</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="properties.tensileStrength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Résistance à la traction (MPa)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="400"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="properties.yieldStrength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite d'élasticité (MPa)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="235"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="properties.elongation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allongement (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="26"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="properties.hardness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dureté (HB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="properties.corrosionResistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Résistance à la corrosion</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="faible">Faible</SelectItem>
                        <SelectItem value="moyenne">Moyenne</SelectItem>
                        <SelectItem value="elevee">Élevée</SelectItem>
                        <SelectItem value="tres-elevee">Très élevée</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Options</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Matériau actif</FormLabel>
                        <FormDescription>
                          Le matériau est disponible pour utilisation
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresInspection"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Contrôle qualité requis</FormLabel>
                        <FormDescription>Le matériau nécessite un contrôle qualité</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hazardous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Matériau dangereux</FormLabel>
                        <FormDescription>
                          Le matériau présente des risques particuliers
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes additionnelles sur le matériau..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Modification en cours...' : 'Modifier le matériau'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
