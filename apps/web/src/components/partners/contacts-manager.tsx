'use client'

import type { Contact, CreateContactDto, PartnerSite, UpdateContactDto } from '@erp/types'
import { ContactRole, ContactStatus } from '@erp/types'
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
import { Building, Edit2, Mail, Phone, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  useCreateContact,
  useDeleteContact,
  usePartnerContacts,
  useUpdateContact,
} from '@/hooks/use-partner-details'

const contactSchema = z?.object({
  civilite: z?.string().optional(),
  nom: z?.string().min(1, 'Le nom est requis'),
  prenom: z?.string().optional(),
  fonction: z?.string().optional(),
  service: z?.string().optional(),
  role: z?.nativeEnum(ContactRole),
  status: z?.nativeEnum(ContactStatus).optional(),
  telephoneDirect: z?.string().optional(),
  telephoneMobile: z?.string().optional(),
  email: z?.string().email().optional().or(z?.literal('')),
  fax: z?.string().optional(),
  isPrincipal: z?.boolean().optional(),
  prefereEmail: z?.boolean().optional(),
  prefereSMS: z?.boolean().optional(),
  accepteMarketing: z?.boolean().optional(),
  partnerSiteId: z?.string().optional(),
  notes: z?.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactsManagerProps {
  partnerId: string
  contacts: Contact[]
  sites?: PartnerSite[]
}

export function ContactsManager({
  partnerId,
  contacts: initialContacts,
  sites = [],
}: ContactsManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const contactsQuery = usePartnerContacts(partnerId)
  const { data: contacts = initialContacts } = contactsQuery
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      role: ContactRole.COMMERCIAL,
      status: ContactStatus.ACTIF,
      isPrincipal: false,
      prefereEmail: true,
      prefereSMS: false,
      accepteMarketing: false,
    },
  })

  const handleCreate = () => {
    setEditingContact(null)
    form?.reset({
      role: ContactRole.COMMERCIAL,
      status: ContactStatus.ACTIF,
      isPrincipal: false,
      prefereEmail: true,
      prefereSMS: false,
      accepteMarketing: false,
    })
    setIsFormOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    form?.reset(contact as ContactFormData)
    setIsFormOpen(true)
  }

  const handleDelete = async (contact: Contact) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${contact.nom} ${contact.prenom || ''} ?`)) {
      await deleteContact?.mutateAsync(contact.id)
    }
  }

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (editingContact) {
        await updateContact?.mutateAsync({ id: editingContact.id, data: data as UpdateContactDto })
      } else {
        await createContact?.mutateAsync({ partnerId, data: data as CreateContactDto })
      }
      setIsFormOpen(false)
      form.reset()
    } catch (_error) {}
  }

  const getRoleBadgeVariant = (role: ContactRole) => {
    const variants: Record<ContactRole, 'default' | 'secondary' | 'outline'> = {
      COMMERCIAL: 'default',
      TECHNIQUE: 'secondary',
      COMPTABILITE: 'outline',
      DIRECTION: 'default',
      ACHAT: 'secondary',
      LOGISTIQUE: 'outline',
      QUALITE: 'outline',
      AUTRE: 'outline',
    }
    return variants[role]
  }

  const getStatusBadgeVariant = (status: ContactStatus) => {
    const variants: Record<ContactStatus, 'default' | 'secondary' | 'destructive'> = {
      ACTIF: 'default',
      INACTIF: 'secondary',
      PARTI: 'destructive',
    }
    return variants[status]
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Contacts ({contacts.length})</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un contact
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun contact enregistré
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts?.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {contact.isPrincipal && (
                          <Badge variant="default" className="h-5">
                            Principal
                          </Badge>
                        )}
                        <div>
                          <div className="font-medium">
                            {contact.civilite} {contact.nom} {contact.prenom}
                          </div>
                          {contact.service && (
                            <div className="text-sm text-muted-foreground">{contact.service}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contact.fonction || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(contact.role)}>{contact.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.telephoneDirect && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${contact.telephoneDirect}`} className="hover:underline">
                              {contact.telephoneDirect}
                            </a>
                          </div>
                        )}
                        {contact.telephoneMobile && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${contact.telephoneMobile}`} className="hover:underline">
                              {contact.telephoneMobile} (mobile)
                            </a>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${contact.email}`} className="hover:underline">
                              {contact.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.partnerSite ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-3 w-3" />
                          {contact?.partnerSite?.nom}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(contact.status)}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Modifier le contact' : 'Nouveau contact'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form?.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form?.control}
                  name="civilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Civilité</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M.">M.</SelectItem>
                          <SelectItem value="Mme">Mme</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input {...field} placeholder="Nom de famille" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form?.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Prénom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form?.control}
                  name="fonction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fonction</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Directeur commercial, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form?.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Service ou département" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form?.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ContactRole.COMMERCIAL}>Commercial</SelectItem>
                          <SelectItem value={ContactRole.TECHNIQUE}>Technique</SelectItem>
                          <SelectItem value={ContactRole.COMPTABILITE}>Comptabilité</SelectItem>
                          <SelectItem value={ContactRole.DIRECTION}>Direction</SelectItem>
                          <SelectItem value={ContactRole.ACHAT}>Achat</SelectItem>
                          <SelectItem value={ContactRole.LOGISTIQUE}>Logistique</SelectItem>
                          <SelectItem value={ContactRole.QUALITE}>Qualité</SelectItem>
                          <SelectItem value={ContactRole.AUTRE}>Autre</SelectItem>
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
                          <SelectItem value={ContactStatus.ACTIF}>Actif</SelectItem>
                          <SelectItem value={ContactStatus.INACTIF}>Inactif</SelectItem>
                          <SelectItem value={ContactStatus.PARTI}>Parti</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form?.control}
                  name="telephoneDirect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone direct</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+33 1 00 00 00 00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form?.control}
                  name="telephoneMobile"
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form?.control}
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
                  control={form?.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+33 1 00 00 00 00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {sites.length > 0 && (
                <FormField
                  control={form?.control}
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
                          {sites?.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.nom} ({site.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="space-y-4">
                <FormField
                  control={form?.control}
                  name="isPrincipal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Contact principal</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form?.control}
                    name="prefereEmail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Préfère email</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form?.control}
                    name="prefereSMS"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Préfère SMS</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form?.control}
                    name="accepteMarketing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Marketing</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form?.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Notes ou informations complémentaires"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createContact?.isPending || updateContact?.isPending}
                >
                  {createContact?.isPending || updateContact?.isPending
                    ? 'Enregistrement...'
                    : editingContact
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
