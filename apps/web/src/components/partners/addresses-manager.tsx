'use client'

import type {
  CreatePartnerAddressDto,
  PartnerAddress,
  PartnerSite,
  UpdatePartnerAddressDto,
} from '@erp/types'
import { AddressStatus, AddressType } from '@erp/types'
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
  Textarea,
} from '@erp/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building, CheckCircle, Edit2, Home, MapPin, Package, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  useCreatePartnerAddress,
  useDeletePartnerAddress,
  usePartnerAddresses,
  useUpdatePartnerAddress,
} from '@/hooks/use-partner-details'
import { formatDate } from '@/lib/utils'

const addressSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est requis'),
  type: z.nativeEnum(AddressType),
  status: z.nativeEnum(AddressStatus).optional(),
  isDefault: z.boolean().optional(),

  // Adresse
  ligne1: z.string().min(1, "L'adresse est requise"),
  ligne2: z.string().optional(),
  ligne3: z.string().optional(),
  codePostal: z.string().min(1, 'Le code postal est requis'),
  ville: z.string().min(1, 'La ville est requise'),
  region: z.string().optional(),
  pays: z.string().optional(),
  codePays: z.string().optional(),

  // Géolocalisation
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),

  // Contact
  contactNom: z.string().optional(),
  contactTelephone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),

  // Instructions et validité
  instructionsAcces: z.string().optional(),
  notes: z.string().optional(),
  partnerSiteId: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressesManagerProps {
  partnerId: string
  addresses: PartnerAddress[]
  sites?: PartnerSite[]
}

export function AddressesManager({
  partnerId,
  addresses: initialAddresses,
  sites = [],
}: AddressesManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<PartnerAddress | null>(null)

  const { data: addresses = initialAddresses } = usePartnerAddresses(partnerId)
  const createAddress = useCreatePartnerAddress()
  const updateAddress = useUpdatePartnerAddress()
  const deleteAddress = useDeletePartnerAddress()

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: AddressType.FACTURATION,
      status: AddressStatus.ACTIVE,
      isDefault: false,
      pays: 'France',
      codePays: 'FR',
    },
  })

  const handleCreate = () => {
    setEditingAddress(null)
    form.reset({
      type: AddressType.FACTURATION,
      status: AddressStatus.ACTIVE,
      isDefault: false,
      pays: 'France',
      codePays: 'FR',
    })
    setIsFormOpen(true)
  }

  const handleEdit = (address: PartnerAddress) => {
    setEditingAddress(address)
    form.reset({
      ...address,
      latitude: address.latitude || undefined,
      longitude: address.longitude || undefined,
      dateDebut: address.dateDebut
        ? new Date(address.dateDebut).toISOString().split('T')[0]
        : undefined,
      dateFin: address.dateFin ? new Date(address.dateFin).toISOString().split('T')[0] : undefined,
    } as AddressFormData)
    setIsFormOpen(true)
  }

  const handleDelete = async (address: PartnerAddress) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'adresse ${address.libelle} ?`)) {
      await deleteAddress.mutateAsync(address.id)
    }
  }

  const onSubmit = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          data: data as UpdatePartnerAddressDto,
        })
      } else {
        await createAddress.mutateAsync({ partnerId, data: data as CreatePartnerAddressDto })
      }
      setIsFormOpen(false)
      form.reset()
    } catch (_error) {}
  }

  const getTypeIcon = (type: AddressType) => {
    const icons = {
      FACTURATION: <Building className="h-4 w-4" />,
      LIVRAISON: <Package className="h-4 w-4" />,
      SIEGE: <Home className="h-4 w-4" />,
      AUTRE: <MapPin className="h-4 w-4" />,
    }
    return icons[type] || <MapPin className="h-4 w-4" />
  }

  const getTypeBadgeVariant = (type: AddressType) => {
    const variants: Record<AddressType, 'default' | 'secondary' | 'outline'> = {
      FACTURATION: 'default',
      LIVRAISON: 'secondary',
      SIEGE: 'outline',
      AUTRE: 'outline',
    }
    return variants[type]
  }

  const getStatusBadgeVariant = (status: AddressStatus) => {
    const variants: Record<AddressStatus, 'default' | 'secondary' | 'destructive'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      ARCHIVED: 'destructive',
    }
    return variants[status]
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Adresses ({addresses.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une adresse
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune adresse enregistrée
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé / Type</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Site associé</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address) => (
                  <TableRow key={address.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {address.isDefault && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {getTypeIcon(address.type)}
                            {address.libelle}
                          </div>
                          <Badge variant={getTypeBadgeVariant(address.type)} className="mt-1">
                            {address.type}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{address.ligne1}</div>
                        {address.ligne2 && <div>{address.ligne2}</div>}
                        {address.ligne3 && <div>{address.ligne3}</div>}
                        <div className="font-medium">
                          {address.codePostal} {address.ville}
                        </div>
                        {address.region && (
                          <div className="text-muted-foreground">{address.region}</div>
                        )}
                        {address.pays && address.pays !== 'France' && (
                          <div className="text-muted-foreground">{address.pays}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {address.contactNom ? (
                        <div className="text-sm">
                          <div className="font-medium">{address.contactNom}</div>
                          {address.contactTelephone && (
                            <div className="text-muted-foreground">{address.contactTelephone}</div>
                          )}
                          {address.contactEmail && (
                            <div className="text-muted-foreground">{address.contactEmail}</div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {address.partnerSite ? (
                        <div className="text-sm">
                          <Building className="h-3 w-3 inline mr-1" />
                          {address.partnerSite.nom}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {address.dateDebut || address.dateFin ? (
                        <div className="text-sm">
                          {address.dateDebut && <div>Du: {formatDate(address.dateDebut)}</div>}
                          {address.dateFin && <div>Au: {formatDate(address.dateFin)}</div>}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Permanente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(address.status)}>
                        {address.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(address)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(address)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Modifier l'adresse" : 'Nouvelle adresse'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="libelle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Libellé</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Adresse principale" />
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
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={AddressType.FACTURATION}>Facturation</SelectItem>
                          <SelectItem value={AddressType.LIVRAISON}>Livraison</SelectItem>
                          <SelectItem value={AddressType.SIEGE}>Siège</SelectItem>
                          <SelectItem value={AddressType.AUTRE}>Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                          <SelectItem value={AddressStatus.ACTIVE}>Active</SelectItem>
                          <SelectItem value={AddressStatus.INACTIVE}>Inactive</SelectItem>
                          <SelectItem value={AddressStatus.ARCHIVED}>Archivée</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {sites.length > 0 && (
                  <FormField
                    control={form.control}
                    name="partnerSiteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site associé</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un site" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                            {sites.map((site) => (
                              <SelectItem key={site.id} value={site.id}>
                                {site.nom} ({site.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Associer cette adresse à un site spécifique
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Adresse par défaut</FormLabel>
                      <FormDescription>
                        Cette adresse sera utilisée par défaut pour ce type
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Adresse</h3>

                <FormField
                  control={form.control}
                  name="ligne1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ligne 1</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Numéro et nom de rue" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ligne2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ligne 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bâtiment, appartement, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ligne3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ligne 3</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Complément d'adresse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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

                  <FormField
                    control={form.control}
                    name="codePays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code pays</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="FR" maxLength={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Géolocalisation (optionnel)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact sur place (optionnel)</h3>

                <FormField
                  control={form.control}
                  name="contactNom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du contact</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Personne à contacter sur place" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactTelephone"
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
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contact@entreprise.fr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informations complémentaires</h3>

                <FormField
                  control={form.control}
                  name="instructionsAcces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions d'accès</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Code d'accès, interphone, étage, etc."
                          rows={3}
                        />
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informations complémentaires" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateDebut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormDescription>
                          Date à partir de laquelle cette adresse est valide
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateFin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormDescription>
                          Date jusqu'à laquelle cette adresse est valide
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createAddress.isPending || updateAddress.isPending}>
                  {createAddress.isPending || updateAddress.isPending
                    ? 'Enregistrement...'
                    : editingAddress
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
