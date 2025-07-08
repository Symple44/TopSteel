'use client'

import { Badge } from "@erp/ui"
import { Button } from "@erp/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@erp/ui"
import { Input } from "@erp/ui"
import { Label } from "@erp/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@erp/ui"
import { Separator } from "@erp/ui"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@erp/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@erp/ui"
import { formatCurrency } from '@/lib/utils'
import {
  Calculator,
  Clock,
  Copy,
  Euro,
  Eye,
  FileText,
  History,
  Plus,
  Save,
  TrendingUp,
  X,
} from 'lucide-react'
import { useState } from 'react'

// Données mockées pour la démonstration
const mockTemplates = [
  {
    id: '1',
    nom: 'Garde-corps standard',
    description: 'Template pour garde-corps avec main courante',
    elements: 12,
    margeCommerciale: 35,
    utilisations: 24,
  },
  {
    id: '2',
    nom: 'Escalier 2 volées',
    description: 'Escalier métallique avec palier intermédiaire',
    elements: 18,
    margeCommerciale: 40,
    utilisations: 15,
  },
  {
    id: '3',
    nom: 'Structure hangar',
    description: 'Structure métallique pour hangar agricole',
    elements: 25,
    margeCommerciale: 30,
    utilisations: 8,
  },
]

const mockHistorique = [
  {
    id: '1',
    date: new Date('2025-06-16'),
    reference: 'CHF-2025-0156',
    client: 'Entreprise ABC',
    projet: 'PRJ-2025-0142',
    montantHT: 45250,
    statut: 'Accepté',
  },
  {
    id: '2',
    date: new Date('2025-06-15'),
    reference: 'CHF-2025-0155',
    client: 'Société XYZ',
    projet: 'PRJ-2025-0141',
    montantHT: 28750,
    statut: 'En attente',
  },
]

export default function ChiffragePage() {
  const [activeTab, setActiveTab] = useState('nouveau')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            Chiffrage
          </h1>
          <p className="text-muted-foreground">Création et gestion des devis et chiffrages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            Historique
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau chiffrage
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nouveau">Nouveau chiffrage</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="nouveau" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau chiffrage</CardTitle>
              <CardDescription>Créer un nouveau devis ou chiffrage pour un projet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="client">Client</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client1">Entreprise ABC</SelectItem>
                        <SelectItem value="client2">Société XYZ</SelectItem>
                        <SelectItem value="client3">SARL Martin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="projet">Projet</Label>
                    <Input placeholder="Nom du projet" />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input placeholder="Description du chiffrage" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dateValidite">Date de validité</Label>
                    <Input type="date" />
                  </div>

                  <div>
                    <Label htmlFor="delaiLivraison">Délai de livraison</Label>
                    <Input placeholder="Ex: 4 semaines" />
                  </div>

                  <div>
                    <Label htmlFor="marge">Marge commerciale (%)</Label>
                    <Input type="number" placeholder="35" />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Éléments du chiffrage</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un élément
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Désignation</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Unité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Total HT</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Input placeholder="Désignation de l'élément" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" placeholder="1" className="w-20" />
                        </TableCell>
                        <TableCell>
                          <Select>
                            <SelectTrigger className="w-24" {...({} as any)}>
                              <SelectValue placeholder="Unité" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="piece">pc</SelectItem>
                              <SelectItem value="m">m</SelectItem>
                              <SelectItem value="m2">m²</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" placeholder="0.00" className="w-24" />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">0,00 €</div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="space-x-2">
                  <Button variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total HT</div>
                  <div className="text-2xl font-bold">0,00 €</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de chiffrage</CardTitle>
              <CardDescription>
                Utilisez des templates pré-configurés pour gagner du temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{template.nom}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex justify-between text-xs">
                          <span>{template.elements} éléments</span>
                          <span>{template.margeCommerciale}% marge</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-muted-foreground">
                            {template.utilisations} utilisations
                          </span>
                          <Button size="sm">Utiliser</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des chiffrages</CardTitle>
              <CardDescription>Consultez et gérez vos chiffrages précédents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Rechercher un chiffrage..." className="max-w-sm" />
                  <Select>
                    <SelectTrigger className="w-[180px]" {...({} as any)}>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous</SelectItem>
                      <SelectItem value="accepte">Accepté</SelectItem>
                      <SelectItem value="attente">En attente</SelectItem>
                      <SelectItem value="refuse">Refusé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Projet</TableHead>
                        <TableHead>Montant HT</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockHistorique.map((chiffrage) => (
                        <TableRow key={chiffrage.id}>
                          <TableCell className="font-medium">{chiffrage.reference}</TableCell>
                          <TableCell>{chiffrage.date.toLocaleDateString()}</TableCell>
                          <TableCell>{chiffrage.client}</TableCell>
                          <TableCell>{chiffrage.projet}</TableCell>
                          <TableCell>{formatCurrency(chiffrage.montantHT)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                chiffrage.statut === 'Accepté'
                                  ? 'default'
                                  : chiffrage.statut === 'En attente'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {chiffrage.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <div className="text-sm font-medium">Chiffrages ce mois</div>
                </div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-muted-foreground">+12% vs mois dernier</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  <div className="text-sm font-medium">Montant total</div>
                </div>
                <div className="text-2xl font-bold">287 450 €</div>
                <div className="text-xs text-muted-foreground">+8% vs mois dernier</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <div className="text-sm font-medium">Taux d'acceptation</div>
                </div>
                <div className="text-2xl font-bold">67%</div>
                <div className="text-xs text-muted-foreground">+3% vs mois dernier</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <div className="text-sm font-medium">Délai moyen</div>
                </div>
                <div className="text-2xl font-bold">3.2j</div>
                <div className="text-xs text-muted-foreground">-0.5j vs mois dernier</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}




