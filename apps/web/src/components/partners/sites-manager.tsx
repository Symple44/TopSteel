'use client'

import type { CreatePartnerSiteDto, PartnerSite, UpdatePartnerSiteDto } from '@erp/types'
import { AccessibiliteType, SiteStatus, SiteType } from '@erp/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@erp/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  Edit2,
  HardHat,
  MapPin,
  Package,
  Plus,
  Trash2,
  Truck,
  Warehouse,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  useCreatePartnerSite,
  useDeletePartnerSite,
  usePartnerSites,
  useUpdatePartnerSite,
} from '@/hooks/use-partner-details'

const siteSchema = z?.object({
  code: z?.string().min(1, 'Le code est requis'),
  nom: z?.string().min(1, 'Le nom est requis'),
  description: z?.string().optional(),
  type: z?.nativeEnum(SiteType),
  status: z?.nativeEnum(SiteStatus).optional(),
  isPrincipal: z?.boolean().optional(),
  accepteLivraisons: z?.boolean().optional(),
  accepteEnlevements: z?.boolean().optional(),

  // Localisation
  adresse: z?.string().optional(),
  adresseComplement: z?.string().optional(),
  codePostal: z?.string().optional(),
  ville: z?.string().optional(),
  pays: z?.string().optional(),
  region: z?.string().optional(),
  latitude: z?.coerce?.number().min(-90).max(90).optional(),
  longitude: z?.coerce?.number().min(-180).max(180).optional(),

  // Contact
  responsable: z?.string().optional(),
  telephone: z?.string().optional(),
  email: z?.string().email().optional().or(z?.literal('')),

  // Capacités
  surfaceM2: z?.coerce?.number().min(0).optional(),
  capaciteStockageTonnes: z?.coerce?.number().min(0).optional(),
  hauteurMaxM: z?.coerce?.number().min(0).optional(),
  poidsMaxTonnes: z?.coerce?.number().min(0).optional(),
  accessibilite: z?.nativeEnum(AccessibiliteType).optional(),
  typeVehiculeMax: z?.string().optional(),
  hasQuaiChargement: z?.boolean().optional(),
  hasChariot: z?.boolean().optional(),
  hasPontRoulant: z?.boolean().optional(),
  hasGrue: z?.boolean().optional(),

  // Instructions
  instructionsLivraison: z?.string().optional(),
  consignesSecurite: z?.string().optional(),
})

type SiteFormData = z.infer<typeof siteSchema>

interface SitesManagerProps {
  partnerId: string
  sites: PartnerSite[]
}

export function SitesManager({ partnerId, sites: initialSites }: SitesManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<PartnerSite | null>(null)
  const [activeTab, setActiveTab] = useState('general')

  const sitesQuery = usePartnerSites(partnerId)
  const { data: sites = initialSites } = sitesQuery
  const createSite = useCreatePartnerSite()
  const updateSite = useUpdatePartnerSite()
  const deleteSite = useDeletePartnerSite()

  // biome-ignore lint/suspicious/noExplicitAny: Required for React Hook Form v7 strict TypeScript compatibility
  const form = useForm<SiteFormData, any, SiteFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: Zod resolver type casting needed for strict mode
    resolver: zodResolver(siteSchema) as any,
    defaultValues: {
      type: SiteType.DEPOT,
      status: SiteStatus.ACTIF,
      isPrincipal: false,
      accepteLivraisons: true,
      accepteEnlevements: true,
      hasQuaiChargement: false,
      hasChariot: false,
      hasPontRoulant: false,
      hasGrue: false,
      pays: 'France',
    },
  })

  const handleCreate = () => {
    setEditingSite(null)
    form?.reset({
      type: SiteType.DEPOT,
      status: SiteStatus.ACTIF,
      isPrincipal: false,
      accepteLivraisons: true,
      accepteEnlevements: true,
      hasQuaiChargement: false,
      hasChariot: false,
      hasPontRoulant: false,
      hasGrue: false,
      pays: 'France',
    })
    setActiveTab('general')
    setIsFormOpen(true)
  }

  const handleEdit = (site: PartnerSite) => {
    setEditingSite(site)
    form?.reset({
      ...site,
      latitude: site.latitude || undefined,
      longitude: site.longitude || undefined,
      surfaceM2: site.surfaceM2 || undefined,
      capaciteStockageTonnes: site.capaciteStockageTonnes || undefined,
      hauteurMaxM: site.hauteurMaxM || undefined,
      poidsMaxTonnes: site.poidsMaxTonnes || undefined,
    } as SiteFormData)
    setActiveTab('general')
    setIsFormOpen(true)
  }

  const handleDelete = async (site: PartnerSite) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le site ${site.nom} ?`)) {
      await deleteSite?.mutateAsync(site.id)
    }
  }

  const onSubmit = async (data: SiteFormData) => {
    try {
      if (editingSite) {
        await updateSite?.mutateAsync({ id: editingSite.id, data: data as UpdatePartnerSiteDto })
      } else {
        await createSite?.mutateAsync({ partnerId, data: data as CreatePartnerSiteDto })
      }
      setIsFormOpen(false)
      form.reset()
    } catch (_error) {}
  }

  const getSiteIcon = (type: SiteType) => {
    const icons = {
      SIEGE_SOCIAL: <Building2 className="h-4 w-4" />,
      USINE: <Warehouse className="h-4 w-4" />,
      DEPOT: <Package className="h-4 w-4" />,
      CHANTIER: <HardHat className="h-4 w-4" />,
      MAGASIN: <Building2 className="h-4 w-4" />,
      BUREAU: <Building2 className="h-4 w-4" />,
      AUTRE: <MapPin className="h-4 w-4" />,
    }
    return icons[type] || <MapPin className="h-4 w-4" />
  }

  const getStatusBadgeVariant = (status: SiteStatus) => {
    const variants: Record<SiteStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ACTIF: 'default',
      INACTIF: 'secondary',
      FERME: 'destructive',
      EN_TRAVAUX: 'outline',
    }
    return variants[status]
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sites ({sites.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un site
          </Button>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun site enregistré</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code / Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Capacités</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites?.map((site: PartnerSite) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {site.isPrincipal && (
                          <Badge variant="default" className="h-5">
                            Principal
                          </Badge>
                        )}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {getSiteIcon(site.type)}
                            {site.nom}
                          </div>
                          <div className="text-sm text-muted-foreground">{site.code}</div>
                          {site.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {site.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{site?.type?.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {site.ville && <div className="text-sm">{site.ville}</div>}
                        {site.codePostal && (
                          <div className="text-xs text-muted-foreground">{site.codePostal}</div>
                        )}
                        {site.region && (
                          <div className="text-xs text-muted-foreground">{site.region}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {site.surfaceM2 && <div>{site.surfaceM2} m²</div>}
                        {site.capaciteStockageTonnes && <div>{site.capaciteStockageTonnes} T</div>}
                        {site.accessibilite && (
                          <Badge variant="outline" className="text-xs">
                            {site.accessibilite}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {site.accepteLivraisons && (
                          <Badge variant="secondary" className="text-xs">
                            <Truck className="h-3 w-3 mr-1" />
                            Livraison
                          </Badge>
                        )}
                        {site.accepteEnlevements && (
                          <Badge variant="secondary" className="text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            Enlèvement
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {site.hasQuaiChargement && (
                          <span className="text-xs text-muted-foreground">Quai</span>
                        )}
                        {site.hasChariot && (
                          <span className="text-xs text-muted-foreground">Chariot</span>
                        )}
                        {site.hasPontRoulant && (
                          <span className="text-xs text-muted-foreground">Pont</span>
                        )}
                        {site.hasGrue && (
                          <span className="text-xs text-muted-foreground">Grue</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(site.status)}>{site.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(site)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(site)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSite ? 'Modifier le site' : 'Nouveau site'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form?.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Général</TabsTrigger>
                  <TabsTrigger value="address">Localisation</TabsTrigger>
                  <TabsTrigger value="capacity">Capacités</TabsTrigger>
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="SITE001" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Dépôt principal" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form?.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Description du site" rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={SiteType.SIEGE_SOCIAL}>Siège social</SelectItem>
                              <SelectItem value={SiteType.USINE}>Usine</SelectItem>
                              <SelectItem value={SiteType.DEPOT}>Dépôt</SelectItem>
                              <SelectItem value={SiteType.CHANTIER}>Chantier</SelectItem>
                              <SelectItem value={SiteType.MAGASIN}>Magasin</SelectItem>
                              <SelectItem value={SiteType.BUREAU}>Bureau</SelectItem>
                              <SelectItem value={SiteType.AUTRE}>Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un statut" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={SiteStatus.ACTIF}>Actif</SelectItem>
                              <SelectItem value={SiteStatus.INACTIF}>Inactif</SelectItem>
                              <SelectItem value={SiteStatus.FERME}>Fermé</SelectItem>
                              <SelectItem value={SiteStatus.EN_TRAVAUX}>En travaux</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form?.control}
                      name="responsable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsable</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom du responsable" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+33 1 00 00 00 00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="site@entreprise.fr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form?.control}
                      name="isPrincipal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Site principal</FormLabel>
                            <FormDescription>Ce site sera utilisé par défaut</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form?.control}
                        name="accepteLivraisons"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Accepte les livraisons</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form?.control}
                        name="accepteEnlevements"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Accepte les enlèvements</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4">
                  <FormField
                    control={form?.control}
                    name="adresse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Numéro et nom de rue" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form?.control}
                    name="adresseComplement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complément d'adresse</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Bâtiment, zone, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form?.control}
                      name="codePostal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code postal</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="00000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="ville"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ville" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="pays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="France" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form?.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Région</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Île-de-France" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.000001" placeholder="48.8566" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.000001" placeholder="2.3522" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="capacity" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="surfaceM2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surface (m²)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="1000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="capaciteStockageTonnes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacité de stockage (tonnes)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="hauteurMaxM"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hauteur max (m)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.1" placeholder="8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="poidsMaxTonnes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poids max (tonnes)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="40" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="accessibilite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accessibilité</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={AccessibiliteType.FACILE}>Facile</SelectItem>
                              <SelectItem value={AccessibiliteType.MOYEN}>Moyen</SelectItem>
                              <SelectItem value={AccessibiliteType.DIFFICILE}>Difficile</SelectItem>
                              <SelectItem value={AccessibiliteType.TRES_DIFFICILE}>
                                Très difficile
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="typeVehiculeMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type véhicule max</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Semi-remorque 40T" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="hasQuaiChargement"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Quai de chargement</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="hasChariot"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Chariot élévateur</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form?.control}
                      name="hasPontRoulant"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Pont roulant</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form?.control}
                      name="hasGrue"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel>Grue</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="instructions" className="space-y-4">
                  <FormField
                    control={form?.control}
                    name="instructionsLivraison"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructions de livraison</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Horaires, accès, consignes particulières..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form?.control}
                    name="consignesSecurite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consignes de sécurité</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="EPI obligatoires, zones interdites, procédures..."
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Indiquez les équipements de protection individuelle requis et les
                          procédures de sécurité
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createSite?.isPending || updateSite?.isPending}>
                  {createSite?.isPending || updateSite?.isPending
                    ? 'Enregistrement...'
                    : editingSite
                      ? 'Modifier'
                      : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
