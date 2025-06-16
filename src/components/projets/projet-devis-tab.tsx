'use client'

import { useState } from 'react'
import { 
  Plus, 
  FileText, 
  Download, 
  Send, 
  Eye, 
  Edit,
  Copy,
  Check,
  X,
  Clock,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Projet, DevisStatut } from '@/types'

interface ProjetDevisTabProps {
  projet: Projet
}

// Données mockées pour la démonstration
const mockDevis = [
  {
    id: '1',
    numero: 'DEV-2025-0142',
    dateEmission: new Date('2025-06-16'),
    dateValidite: new Date('2025-07-16'),
    statut: DevisStatut.ACCEPTE,
    montantHT: 45250,
    montantTVA: 9050,
    montantTTC: 54300,
    version: 2,
    lignes: [
      {
        id: '1',
        description: 'Poutre IPE 200 - 6m',
        quantite: 8,
        unite: 'pièce',
        prixUnitaire: 245,
        montantHT: 1960,
      },
      {
        id: '2',
        description: 'Garde-corps acier galvanisé - Sur mesure',
        quantite: 45,
        unite: 'm',
        prixUnitaire: 350,
        montantHT: 15750,
      },
      {
        id: '3',
        description: 'Escalier métallique 2 volées',
        quantite: 1,
        unite: 'ensemble',
        prixUnitaire: 12500,
        montantHT: 12500,
      },
      {
        id: '4',
        description: 'Main d\'œuvre - Montage et installation',
        quantite: 120,
        unite: 'heures',
        prixUnitaire: 45,
        montantHT: 5400,
      },
      {
        id: '5',
        description: 'Traitement anticorrosion et peinture',
        quantite: 1,
        unite: 'forfait',
        prixUnitaire: 3500,
        montantHT: 3500,
      },
    ],
  },
  {
    id: '2',
    numero: 'DEV-2025-0141',
    dateEmission: new Date('2025-06-15'),
    dateValidite: new Date('2025-07-15'),
    statut: DevisStatut.REFUSE,
    montantHT: 52000,
    montantTVA: 10400,
    montantTTC: 62400,
    version: 1,
    lignes: [],
  },
]

export function ProjetDevisTab({ projet }: ProjetDevisTabProps) {
  const [selectedDevis, setSelectedDevis] = useState(mockDevis[0])

  const getStatusBadge = (statut: DevisStatut) => {
    const statusConfig = {
      [DevisStatut.BROUILLON]: { label: 'Brouillon', variant: 'outline' as const, icon: Edit },
      [DevisStatut.ENVOYE]: { label: 'Envoyé', variant: 'secondary' as const, icon: Send },
      [DevisStatut.ACCEPTE]: { label: 'Accepté', variant: 'default' as const, icon: Check },
      [DevisStatut.REFUSE]: { label: 'Refusé', variant: 'destructive' as const, icon: X },
      [DevisStatut.EXPIRE]: { label: 'Expiré', variant: 'outline' as const, icon: Clock },
    }
    
    const config = statusConfig[statut]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Liste des devis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Devis du projet</CardTitle>
              <CardDescription>
                Gérez les devis et propositions commerciales
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau devis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDevis.map((devis) => (
                  <TableRow
                    key={devis.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedDevis(devis)}
                  >
                    <TableCell className="font-medium">
                      {devis.numero}
                      {devis.version > 1 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          v{devis.version}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(devis.dateEmission)}</TableCell>
                    <TableCell>{formatDate(devis.dateValidite)}</TableCell>
                    <TableCell>{getStatusBadge(devis.statut)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(devis.montantHT)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer par email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Détail du devis sélectionné */}
      {selectedDevis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedDevis.numero}</CardTitle>
                <CardDescription>
                  Émis le {formatDate(selectedDevis.dateEmission)} - 
                  Valide jusqu'au {formatDate(selectedDevis.dateValidite)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedDevis.statut)}
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDevis.lignes.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDevis.lignes.map((ligne) => (
                        <TableRow key={ligne.id}>
                          <TableCell>{ligne.description}</TableCell>
                          <TableCell className="text-right">
                            {ligne.quantite} {ligne.unite}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(ligne.prixUnitaire)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(ligne.montantHT)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total HT</span>
                      <span className="font-medium">
                        {formatCurrency(selectedDevis.montantHT)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVA (20%)</span>
                      <span className="font-medium">
                        {formatCurrency(selectedDevis.montantTVA)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total TTC</span>
                      <span className="text-primary">
                        {formatCurrency(selectedDevis.montantTTC)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg bg-muted p-4">
                  <h4 className="font-semibold mb-2">Conditions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Validité de l'offre : 30 jours</li>
                    <li>• Acompte de 30% à la commande</li>
                    <li>• Solde à la livraison</li>
                    <li>• Délai de réalisation : 4 semaines après commande</li>
                    <li>• Garantie décennale sur la structure</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Détails du devis non disponibles
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}