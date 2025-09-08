'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Layers, Package } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert } from '../../../feedback/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../forms/form/form'
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

// div components removed - not available in the UI library

// Material categories specific to steel manufacturing
const STEEL_CATEGORIES = [
  'structural-steel',
  'sheet-metal',
  'tubes-pipes',
  'profiles',
  'reinforcement-bars',
  'specialty-steels',
  'consumables',
  'fasteners',
  'coatings',
  'other',
] as const
const STEEL_GRADES = [
  'S235',
  'S275',
  'S355',
  'S460',
  'S690',
  'C22',
  'C30',
  'C45',
  '304L',
  '316L',
  '2205',
  'Hardox-400',
  'Hardox-500',
  'Custom',
] as const
const UNITS = ['kg', 'tons', 'pieces', 'meters', 'square-meters', 'cubic-meters', 'liters'] as const
const SURFACE_TREATMENTS = [
  'none',
  'galvanized',
  'painted',
  'powder-coated',
  'anodized',
  'chrome-plated',
  'zinc-plated',
  'sandblasted',
  'pickled',
  'passivated',
] as const
// Material validation schema for steel manufacturing
const materialSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Le nom du matériau est requis'),
  code: z.string().min(1, 'Le code matériau est requis'),
  description: z.string().optional(),
  category: z.enum(STEEL_CATEGORIES),
  // Steel-specific properties
  steelGrade: z.enum([...STEEL_GRADES, 'Custom'] as const).optional(),
  customGrade: z.string().optional(),
  // Physical Properties
  dimensions: z.object({
    length: z.number().min(0, 'La longueur doit être positive').optional(),
    width: z.number().min(0, 'La largeur doit être positive').optional(),
    height: z.number().min(0, 'La hauteur doit être positive').optional(),
    diameter: z.number().min(0, 'Le diamètre doit être positif').optional(),
    thickness: z.number().min(0, "L'épaisseur doit être positive").optional(),
  }),
  // Material Properties
  density: z.number().min(0, 'La densité doit être positive').optional(),
  weight: z.number().min(0, 'Le poids doit être positif').optional(),
  surfaceTreatment: z.enum(SURFACE_TREATMENTS).default('none'),
  // Mechanical Properties
  mechanicalProperties: z.object({
    yieldStrength: z.number().min(0, "La limite d'élasticité doit être positive").optional(),
    tensileStrength: z.number().min(0, 'La résistance à la traction doit être positive').optional(),
    elongation: z.number().min(0, "L'allongement doit être positif").optional(),
    hardness: z.string().optional(),
  }),
  // Chemical Composition
  chemicalComposition: z.object({
    carbon: z.number().min(0).max(100).optional(),
    manganese: z.number().min(0).max(100).optional(),
    silicon: z.number().min(0).max(100).optional(),
    phosphorus: z.number().min(0).max(100).optional(),
    sulfur: z.number().min(0).max(100).optional(),
    chromium: z.number().min(0).max(100).optional(),
    nickel: z.number().min(0).max(100).optional(),
    molybdenum: z.number().min(0).max(100).optional(),
    other: z.string().optional(),
  }),
  // Pricing and Inventory
  unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
  unit: z.enum(UNITS),
  minimumStock: z.number().min(0, 'Le stock minimum doit être positif').default(0),
  currentStock: z.number().min(0, 'Le stock actuel doit être positif').default(0),
  // Suppliers and Procurement
  primarySupplier: z.string().optional(),
  alternativeSuppliers: z.array(z.string()).optional(),
  leadTime: z.number().min(0, 'Le délai doit être positif').optional(), // in days
  // Quality and Compliance
  qualityStandards: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  hazardClassification: z.string().optional(),
  // Additional Information
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  isCustomMade: z.boolean().default(false),
  imageUrls: z.array(z.string()).optional(),
})
type MaterialFormData = z.infer<typeof materialSchema>
interface AddMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: MaterialFormData) => void | Promise<void>
  defaultCategory?: (typeof STEEL_CATEGORIES)[number]
  defaultSupplier?: string
}
export function AddMaterialDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultCategory,
  defaultSupplier,
}: AddMaterialDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      category: defaultCategory || 'structural-steel',
      steelGrade: 'S235',
      dimensions: {},
      mechanicalProperties: {},
      chemicalComposition: {},
      unit: 'kg',
      unitPrice: 0,
      minimumStock: 0,
      currentStock: 0,
      surfaceTreatment: 'none',
      primarySupplier: defaultSupplier || '',
      alternativeSuppliers: [],
      qualityStandards: [],
      certifications: [],
      imageUrls: [],
      isActive: true,
      isCustomMade: false,
    },
  })
  const _watchCategory = form.watch('category')
  const watchSteelGrade = form.watch('steelGrade')
  const _watchIsCustomMade = form.watch('isCustomMade')
  const handleSubmit = async (data: MaterialFormData) => {
    try {
      setLoading(true)
      setError(null)
      // Validate custom steel grade
      if (data.steelGrade === 'Custom' && !data.customGrade) {
        setError("Veuillez spécifier la nuance d'acier personnalisée")
        return
      }
      await onSubmit?.(data)
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
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'structural-steel': 'Acier de construction',
      'sheet-metal': 'Tôlerie',
      'tubes-pipes': 'Tubes et tuyaux',
      profiles: 'Profilés',
      'reinforcement-bars': "Barres d'armature",
      'specialty-steels': 'Aciers spéciaux',
      consumables: 'Consommables',
      fasteners: 'Fixations',
      coatings: 'Revêtements',
      other: 'Autre',
    }
    return labels[category] || category
  }
  const getSurfaceTreatmentLabel = (treatment: string) => {
    const labels: Record<string, string> = {
      none: 'Aucun',
      galvanized: 'Galvanisé',
      painted: 'Peint',
      'powder-coated': 'Thermolaqué',
      anodized: 'Anodisé',
      'chrome-plated': 'Chromé',
      'zinc-plated': 'Zingué',
      sandblasted: 'Sablé',
      pickled: 'Décapé',
      passivated: 'Passivé',
    }
    return labels[treatment] || treatment
  }
  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      kg: 'Kilogrammes',
      tons: 'Tonnes',
      pieces: 'Pièces',
      meters: 'Mètres',
      'square-meters': 'Mètres carrés',
      'cubic-meters': 'Mètres cubes',
      liters: 'Litres',
    }
    return labels[unit] || unit
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un nouveau matériau
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <div>{error}</div>
                </Alert>
              )}
              {/* Basic Information */}
              <div>
                <div>
                  <h3 className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Informations générales
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du matériau *</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: Poutre IPE 200 S235" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code matériau *</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: IPE200-S235" {...field} />
                        </FormControl>
                        <FormDescription>Code unique pour identifier le matériau</FormDescription>
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
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STEEL_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {getCategoryLabel(cat)}
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
                    name="steelGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nuance d'acier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STEEL_GRADES.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchSteelGrade === 'Custom' && (
                    <FormField
                      control={form.control}
                      name="customGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nuance personnalisée *</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: S355J2+N" {...field} />
                          </FormControl>
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
                            placeholder="Description détaillée du matériau..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* Dimensions */}
              <div>
                <div>
                  <h3 className="text-lg">Dimensions (mm)</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="dimensions.length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longueur</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
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
                    name="dimensions.width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largeur</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
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
                    name="dimensions.height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hauteur</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
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
                    name="dimensions.diameter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diamètre</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
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
                    name="dimensions.thickness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Épaisseur</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
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
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poids (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
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
              </div>
              {/* Surface Treatment */}
              <div>
                <div>
                  <h3 className="text-lg">Traitement de surface</h3>
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="surfaceTreatment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Traitement appliqué</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SURFACE_TREATMENTS.map((treatment) => (
                              <SelectItem key={treatment} value={treatment}>
                                {getSurfaceTreatmentLabel(treatment)}
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
              {/* Mechanical Properties */}
              <div>
                <div>
                  <h3 className="text-lg">Propriétés mécaniques</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="mechanicalProperties.yieldStrength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite d'élasticité (MPa)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="235"
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
                    name="mechanicalProperties.tensileStrength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Résistance à la traction (MPa)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="360"
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
                    name="mechanicalProperties.elongation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allongement (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="26"
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
                    name="mechanicalProperties.hardness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dureté</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: 120 HB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* Pricing and Stock */}
              <div>
                <div>
                  <h3 className="text-lg">Prix et stock</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {getUnitLabel(unit)}
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
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock actuel</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
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
                        <FormLabel>Stock minimum</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              {/* Procurement */}
              <div>
                <div>
                  <h3 className="text-lg">Approvisionnement</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="primarySupplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fournisseur principal</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom du fournisseur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="leadTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Délai de livraison (jours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="7"
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
              </div>
              {/* Additional Information */}
              <div>
                <div>
                  <h3 className="text-lg">Informations complémentaires</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-6">
                    <FormField
                      control={form.control}
                      name="isCustomMade"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Matériau sur mesure</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">Matériau actif</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="hazardClassification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classification de danger</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: Non dangereux, Inflammable..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Classification selon les normes de sécurité
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires sur le matériau..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                  {loading ? 'Création en cours...' : 'Créer le matériau'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
