'use client'

import type { CreatePartnerDto, Partner, PartnerGroup, UpdatePartnerDto } from '@erp/types'
import { PartnerStatus, PartnerType } from '@erp/types'
import {
  Button,
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
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CreditCard, FileText, MapPin, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Control, useForm } from 'react-hook-form'
import * as z from 'zod'
import { useCreatePartner, usePartnerGroups, useUpdatePartner } from '@/hooks/use-partners'

const partnerSchema = z.object({
  code: z.string().optional(),
  type: z.nativeEnum(PartnerType),
  denomination: z.string().min(1, 'La dénomination est requise'),
  denominationCommerciale: z.string().optional(),
  category: z.string().min(1, 'La catégorie est requise'),
  status: z.nativeEnum(PartnerStatus).optional(),

  // Identification
  siret: z.string().optional(),
  numeroTVA: z.string().optional(),
  codeAPE: z.string().optional(),

  // Contact
  contactPrincipal: z.string().optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  siteWeb: z.string().url().optional().or(z.literal('')),

  // Adresse
  adresse: z.string().optional(),
  adresseComplement: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),

  // Commercial
  conditionsPaiement: z.string().optional(),
  modePaiement: z.string().optional(),
  plafondCredit: z.coerce.number().optional(),
  tauxRemise: z.coerce.number().min(0).max(100).optional(),
  representantCommercial: z.string().optional(),
  groupId: z.string().optional(),

  // Fournisseur
  delaiLivraison: z.coerce.number().optional(),
  montantMiniCommande: z.coerce.number().optional(),
  fournisseurPrefere: z.boolean().optional(),

  // Comptabilité
  compteComptableClient: z.string().optional(),
  compteComptableFournisseur: z.string().optional(),
})

type PartnerFormData = z.infer<typeof partnerSchema>

interface PartnerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner?: Partner | null
  defaultType?: PartnerType | string
}

// Catégories métallurgie
const PARTNER_CATEGORIES = [
  'ACIER_NEGOCE',
  'ACIER_PRODUCTION',
  'ALUMINIUM',
  'INOX',
  'METALLURGIE_GENERALE',
  'TRANSFORMATION_METAUX',
  'CONSTRUCTION_METALLIQUE',
  'CHAUDRONNERIE',
  'FONDERIE',
  'TRAITEMENT_SURFACE',
  'RECYCLAGE_METAUX',
  'OUTILLAGE',
  'QUINCAILLERIE',
  'BTP',
  'INDUSTRIE',
  'TRANSPORT',
  'ENERGIE',
  'AUTRE',
]

const PAYMENT_TERMS = [
  'COMPTANT',
  '30_JOURS',
  '30_JOURS_FIN_MOIS',
  '45_JOURS',
  '45_JOURS_FIN_MOIS',
  '60_JOURS',
  '60_JOURS_FIN_MOIS',
  '90_JOURS',
]

const PAYMENT_METHODS = [
  'VIREMENT',
  'CHEQUE',
  'PRELEVEMENT',
  'CARTE_BANCAIRE',
  'ESPECES',
  'TRAITE',
  'LCR',
]

export function PartnerFormDialog({
  open,
  onOpenChange,
  partner,
  defaultType,
}: PartnerFormDialogProps) {
  const [activeTab, setActiveTab] = useState('general')
  const createPartner = useCreatePartner()
  const updatePartner = useUpdatePartner()
  const groupsQuery = usePartnerGroups()
  const { data: groups = [] } = groupsQuery

  const isEditing = !!partner

  const form = useForm({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      type: (defaultType as PartnerType) || PartnerType.CLIENT,
      status: PartnerStatus.ACTIF,
      category: 'ACIER_NEGOCE',
      pays: 'France',
      fournisseurPrefere: false,
      ...partner,
    },
  })

  useEffect(() => {
    if (partner) {
      form.reset({
        ...partner,
        plafondCredit: partner.plafondCredit || undefined,
        tauxRemise: partner.tauxRemise || undefined,
        delaiLivraison: partner.delaiLivraison || undefined,
        montantMiniCommande: partner.montantMiniCommande || undefined,
      })
    }
  }, [partner, form])

  const onSubmit = async (data: PartnerFormData) => {
    try {
      if (isEditing && partner) {
        await updatePartner.mutateAsync({ id: partner.id, data: data as UpdatePartnerDto })
      } else {
        await createPartner.mutateAsync(data as CreatePartnerDto)
      }
      onOpenChange(false)
      form.reset()
    } catch (_error) {}
  }

  const partnerType = form.watch('type')
  const showClientFields = partnerType === PartnerType.CLIENT || partnerType === PartnerType.MIXTE
  const showSupplierFields =
    partnerType === PartnerType.FOURNISSEUR || partnerType === PartnerType.MIXTE

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le partenaire' : 'Nouveau partenaire'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">
                  <Building2 className="mr-2 h-4 w-4" />
                  Général
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="address">
                  <MapPin className="mr-2 h-4 w-4" />
                  Adresse
                </TabsTrigger>
                <TabsTrigger value="commercial">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Commercial
                </TabsTrigger>
                <TabsTrigger value="accounting">
                  <FileText className="mr-2 h-4 w-4" />
                  Comptabilité
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value={PartnerType.CLIENT}>Client</SelectItem>
                            <SelectItem value={PartnerType.FOURNISSEUR}>Fournisseur</SelectItem>
                            <SelectItem value={PartnerType.MIXTE}>Mixte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            <SelectItem value={PartnerStatus.ACTIF}>Actif</SelectItem>
                            <SelectItem value={PartnerStatus.INACTIF}>Inactif</SelectItem>
                            <SelectItem value={PartnerStatus.PROSPECT}>Prospect</SelectItem>
                            <SelectItem value={PartnerStatus.SUSPENDU}>Suspendu</SelectItem>
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
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Auto-généré si vide" />
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
                        <FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PARTNER_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat.replace(/_/g, ' ')}
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
                  name="denomination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dénomination sociale</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Raison sociale complète" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="denominationCommerciale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dénomination commerciale</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom commercial (optionnel)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="siret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SIRET</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="000 000 000 00000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numeroTVA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>N° TVA Intracommunautaire</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="FR00000000000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codeAPE"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code APE</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0000A" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactPrincipal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact principal</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom du contact principal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone fixe</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+33 1 00 00 00 00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone mobile</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+33 6 00 00 00 00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
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

                <FormField
                  control={form.control}
                  name="siteWeb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site web</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://www.entreprise.fr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="adresseComplement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complément d'adresse</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bâtiment, étage, etc." />
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
              </TabsContent>

              <TabsContent value="commercial" className="space-y-4">
                {groups.length > 0 && (
                  <FormField
                    control={form.control}
                    name="groupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Groupe tarifaire</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un groupe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                            {groups.map((group: PartnerGroup) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                                {group.defaultDiscount && ` (-${group.defaultDiscount}%)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Le groupe détermine les remises et conditions commerciales par défaut
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conditionsPaiement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conditions de paiement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_TERMS.map((term) => (
                              <SelectItem key={term} value={term}>
                                {term.replace(/_/g, ' ')}
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
                    name="modePaiement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode de paiement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_METHODS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {showClientFields && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="plafondCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plafond de crédit (€)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                type="number"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tauxRemise"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taux de remise (%)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="representantCommercial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Représentant commercial</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom du commercial" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {showSupplierFields && (
                  <>
                    <Separator />
                    <h3 className="text-lg font-semibold">Paramètres fournisseur</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="delaiLivraison"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Délai de livraison (jours)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                type="number"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="montantMiniCommande"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant minimum commande (€)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                type="number"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fournisseurPrefere"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Fournisseur préféré</FormLabel>
                            <FormDescription>
                              Ce fournisseur sera proposé en priorité
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="accounting" className="space-y-4">
                {showClientFields && (
                  <FormField
                    control={form.control}
                    name="compteComptableClient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compte comptable client</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="411000" />
                        </FormControl>
                        <FormDescription>
                          Compte utilisé pour la comptabilité client
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showSupplierFields && (
                  <FormField
                    control={form.control}
                    name="compteComptableFournisseur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compte comptable fournisseur</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="401000" />
                        </FormControl>
                        <FormDescription>
                          Compte utilisé pour la comptabilité fournisseur
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createPartner.isPending || updatePartner.isPending}>
                {createPartner.isPending || updatePartner.isPending
                  ? 'Enregistrement...'
                  : isEditing
                    ? 'Modifier'
                    : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
