'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@erp/ui'
import { Button } from '@erp/ui'
import { Badge } from '@erp/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Separator } from '@erp/ui'
import { ScrollArea } from '@erp/ui'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users,
  Edit,
  ExternalLink,
} from 'lucide-react'
import type { Partner } from '@erp/types'
import { PartnerType, type PartnerStatus } from '@erp/types'
import { usePartnerComplete } from '@/hooks/use-partners'
import { ContactsManager } from './contacts-manager'
import { SitesManager } from './sites-manager'
import { AddressesManager } from './addresses-manager'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@erp/ui'

interface PartnerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: Partner
  onEdit?: () => void
}

export function PartnerDetailDialog({
  open,
  onOpenChange,
  partner,
  onEdit,
}: PartnerDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: completeData } = usePartnerComplete(partner.id)

  const getStatusColor = (status: PartnerStatus) => {
    const colors = {
      ACTIF: 'bg-green-500',
      INACTIF: 'bg-gray-500',
      PROSPECT: 'bg-blue-500',
      SUSPENDU: 'bg-red-500',
      ARCHIVE: 'bg-gray-400',
    }
    return colors[status] || 'bg-gray-500'
  }

  const getTypeIcon = (type: PartnerType) => {
    switch (type) {
      case PartnerType.CLIENT:
        return <Users className="h-4 w-4" />
      case PartnerType.FOURNISSEUR:
        return <Building2 className="h-4 w-4" />
      case PartnerType.MIXTE:
        return <Users className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl">
                {partner.denominationCommerciale || partner.denomination}
              </DialogTitle>
              <Badge variant="outline" className="gap-1">
                {getTypeIcon(partner.type)}
                {partner.type}
              </Badge>
              <div className={cn('h-2 w-2 rounded-full', getStatusColor(partner.status))} />
              <span className="text-sm text-muted-foreground">{partner.status}</span>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Code: {partner.code} | Catégorie: {partner.category?.replace(/_/g, ' ')}
            {completeData?.group && (
              <> | Groupe: {completeData.group.name}</>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="contacts">
              Contacts ({completeData?.contacts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sites">
              Sites ({completeData?.sites?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="addresses">
              Adresses ({completeData?.addresses?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {partner.denomination !== partner.denominationCommerciale && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Raison sociale:</span>
                        <span className="text-sm font-medium">{partner.denomination}</span>
                      </div>
                    )}
                    {partner.siret && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">SIRET:</span>
                        <span className="text-sm font-medium">{partner.siret}</span>
                      </div>
                    )}
                    {partner.numeroTVA && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">N° TVA:</span>
                        <span className="text-sm font-medium">{partner.numeroTVA}</span>
                      </div>
                    )}
                    {partner.codeAPE && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Code APE:</span>
                        <span className="text-sm font-medium">{partner.codeAPE}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact principal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact principal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {partner.contactPrincipal && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{partner.contactPrincipal}</span>
                      </div>
                    )}
                    {partner.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${partner.telephone}`} className="text-sm hover:underline">
                          {partner.telephone}
                        </a>
                      </div>
                    )}
                    {partner.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${partner.mobile}`} className="text-sm hover:underline">
                          {partner.mobile} (mobile)
                        </a>
                      </div>
                    )}
                    {partner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${partner.email}`} className="text-sm hover:underline">
                          {partner.email}
                        </a>
                      </div>
                    )}
                    {partner.siteWeb && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={partner.siteWeb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center gap-1"
                        >
                          {partner.siteWeb}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Adresse principale */}
                {(partner.adresse || partner.ville) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Adresse principale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          {partner.adresse && <div>{partner.adresse}</div>}
                          {partner.adresseComplement && <div>{partner.adresseComplement}</div>}
                          {(partner.codePostal || partner.ville) && (
                            <div>
                              {partner.codePostal} {partner.ville}
                            </div>
                          )}
                          {partner.pays && partner.pays !== 'France' && <div>{partner.pays}</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informations commerciales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informations commerciales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {partner.conditionsPaiement && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Conditions:</span>
                        <span className="text-sm font-medium">
                          {partner.conditionsPaiement.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {partner.modePaiement && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Mode:</span>
                        <span className="text-sm font-medium">
                          {partner.modePaiement.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {partner.plafondCredit !== undefined && partner.plafondCredit !== null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Plafond crédit:</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(partner.plafondCredit)}
                        </span>
                      </div>
                    )}
                    {partner.tauxRemise !== undefined && partner.tauxRemise !== null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remise:</span>
                        <span className="text-sm font-medium">{partner.tauxRemise}%</span>
                      </div>
                    )}
                    {partner.representantCommercial && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Commercial:</span>
                        <span className="text-sm font-medium">{partner.representantCommercial}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informations fournisseur */}
                {(partner.type === PartnerType.FOURNISSEUR || partner.type === PartnerType.MIXTE) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Informations fournisseur</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {partner.delaiLivraison !== undefined && partner.delaiLivraison !== null && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Délai livraison:</span>
                          <span className="text-sm font-medium">{partner.delaiLivraison} jours</span>
                        </div>
                      )}
                      {partner.montantMiniCommande !== undefined && partner.montantMiniCommande !== null && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Commande min:</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(partner.montantMiniCommande)}
                          </span>
                        </div>
                      )}
                      {partner.fournisseurPrefere && (
                        <Badge variant="default" className="w-full justify-center">
                          Fournisseur préféré
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Comptabilité */}
                {(partner.compteComptableClient || partner.compteComptableFournisseur) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Comptabilité</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {partner.compteComptableClient && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Compte client:</span>
                          <span className="text-sm font-medium">{partner.compteComptableClient}</span>
                        </div>
                      )}
                      {partner.compteComptableFournisseur && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Compte fournisseur:</span>
                          <span className="text-sm font-medium">
                            {partner.compteComptableFournisseur}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Groupe tarifaire */}
              {completeData?.group && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Groupe tarifaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{completeData.group.name}</p>
                        {completeData.group.description && (
                          <p className="text-sm text-muted-foreground">
                            {completeData.group.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {completeData.group.defaultDiscount && (
                          <Badge variant="secondary">-{completeData.group.defaultDiscount}%</Badge>
                        )}
                        {completeData.group.creditLimit && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Plafond: {formatCurrency(completeData.group.creditLimit)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations système</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Créé le:</span>
                    <span className="text-sm">{formatDate(partner.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Modifié le:</span>
                    <span className="text-sm">{formatDate(partner.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              {completeData && (
                <ContactsManager
                  partnerId={partner.id}
                  contacts={completeData.contacts || []}
                  sites={completeData.sites || []}
                />
              )}
            </TabsContent>

            <TabsContent value="sites">
              {completeData && (
                <SitesManager
                  partnerId={partner.id}
                  sites={completeData.sites || []}
                />
              )}
            </TabsContent>

            <TabsContent value="addresses">
              {completeData && (
                <AddressesManager
                  partnerId={partner.id}
                  addresses={completeData.addresses || []}
                  sites={completeData.sites || []}
                />
              )}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historique des activités</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    L'historique des commandes, factures et interactions sera affiché ici.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}