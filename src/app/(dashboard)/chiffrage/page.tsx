'use client'

import { useState } from 'react'
import { 
  Calculator, 
  Plus, 
  Save, 
  FileText,
  Settings,
  TrendingUp,
  Euro,
  Percent,
  Package,
  Users,
  Clock,
  Copy,
  History,
  Download,
  X,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { CategorieProduit, UniteMesure } from '@/types'

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
    client: 'SARL Martin',
    projet: 'PRJ-2025-0141',
    montantHT: 28500,
    statut: 'En attente',
  },
  {
    id: '3',
    date: new Date('2025-06-14'),
    reference: 'CHF-2025-0154',
    client: 'Société XYZ',
    projet: 'PRJ-2025-0140',
    montantHT: 32800,
    statut: 'Refusé',
  },
]

export default function ChiffragePage() {
  const [activeTab, setActiveTab] = useState('nouveau')
  const [elements, setElements] = useState<any[]>([])
  const [montantMatieres, setMontantMatieres] = useState(0)
  const [montantMainOeuvre, setMontantMainOeuvre] = useState(0)
  const [montantSousTraitance, setMontantSousTraitance] = useState(0)
  const [margeCommerciale, setMargeCommerciale] = useState(35)
  const [tauxTVA, setTauxTVA] = useState(20)

  // Calculs
  const sousTotal = montantMatieres + montantMainOeuvre + montantSousTraitance
  const montantMarge = sousTotal * (margeCommerciale / 100)
  const montantHT = sousTotal + montantMarge
  const montantTVA = montantHT * (tauxTVA / 100)
  const montantTTC = montantHT + montantTVA

  const ajouterElement = () => {
    const nouvelElement = {
      id: Date.now().toString(),
      type: 'matiere',
      designation: '',
      quantite: 1,
      unite: UniteMesure.PIECE,
      prixUnitaire: 0,
      montant: 0,
    }
    setElements([...elements, nouvelElement])
  }

  const supprimerElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id))
  }

  const modifierElement = (id: string, champ: string, valeur: any) => {
    setElements(elements.map(el => {
      if (el.id === id) {
        const updated = { ...el, [champ]: valeur }
        if (champ === 'quantite' || champ === 'prixUnitaire') {
          updated.montant = updated.quantite * updated.prixUnitaire
        }
        return updated
      }
      return el
    }))
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Module de chiffrage</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos devis avec précision
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffrages ce mois</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              +20% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(458750)}</div>
            <p className="text-xs text-muted-foreground">
              Chiffrages acceptés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">
              Devis acceptés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge moyenne</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35%</div>
            <p className="text-xs text-muted-foreground">
              Sur les projets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de contenu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="nouveau">Nouveau chiffrage</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="nouveau" className="space-y-6">
          {/* Informations du chiffrage */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du chiffrage</CardTitle>
              <CardDescription>
                Détails généraux du devis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Entreprise ABC</SelectItem>
                      <SelectItem value="2">Société XYZ</SelectItem>
                      <SelectItem value="3">SARL Martin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projet">Projet (optionnel)</Label>
                  <Select>
                    <SelectTrigger id="projet">
                      <SelectValue placeholder="Lier à un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">PRJ-2025-0142</SelectItem>
                      <SelectItem value="2">PRJ-2025-0141</SelectItem>
                      <SelectItem value="3">PRJ-2025-0140</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Éléments du chiffrage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Éléments du chiffrage</CardTitle>
                  <CardDescription>
                    Ajoutez les matières, main d'œuvre et sous-traitance
                  </CardDescription>
                </div>
                <Button onClick={ajouterElement}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un élément
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {elements.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Type</TableHead>
                        <TableHead>Désignation</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead className="w-[120px]">Unité</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Montant HT</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {elements.map((element) => (
                        <TableRow key={element.id}>
                          <TableCell>
                            <Select
                              value={element.type}
                              onValueChange={(value) => modifierElement(element.id, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="matiere">
                                  <div className="flex items-center">
                                    <Package className="mr-2 h-4 w-4" />
                                    Matière
                                  </div>
                                </SelectItem>
                                <SelectItem value="main-oeuvre">
                                  <div className="flex items-center">
                                    <Users className="mr-2 h-4 w-4" />
                                    Main d'œuvre
                                  </div>
                                </SelectItem>
                                <SelectItem value="sous-traitance">
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Sous-traitance
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={element.designation}
                              onChange={(e) => modifierElement(element.id, 'designation', e.target.value)}
                              placeholder="Description..."
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={element.quantite}
                              onChange={(e) => modifierElement(element.id, 'quantite', parseFloat(e.target.value) || 0)}
                              className="text-right"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={element.unite}
                              onValueChange={(value) => modifierElement(element.id, 'unite', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={UniteMesure.PIECE}>Pièce</SelectItem>
                                <SelectItem value={UniteMesure.METRE}>Mètre</SelectItem>
                                <SelectItem value={UniteMesure.METRE_CARRE}>m²</SelectItem>
                                <SelectItem value={UniteMesure.KILOGRAMME}>kg</SelectItem>
                                <SelectItem value="heure">Heure</SelectItem>
                                <SelectItem value="forfait">Forfait</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={element.prixUnitaire}
                              onChange={(e) => modifierElement(element.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                              className="text-right"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(element.montant)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => supprimerElement(element.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calculator className="mx-auto h-12 w-12 mb-4" />
                  <p>Aucun élément ajouté</p>
                  <p className="text-sm">Cliquez sur "Ajouter un élément" pour commencer</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Récapitulatif et paramètres */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Paramètres */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du chiffrage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="marge">Marge commerciale (%)</Label>
                  <Input
                    id="marge"
                    type="number"
                    value={margeCommerciale}
                    onChange={(e) => setMargeCommerciale(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tva">Taux de TVA (%)</Label>
                  <Select value={tauxTVA.toString()} onValueChange={(v) => setTauxTVA(parseFloat(v))}>
                    <SelectTrigger id="tva">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20% (Taux normal)</SelectItem>
                      <SelectItem value="10">10% (Taux réduit)</SelectItem>
                      <SelectItem value="5.5">5.5% (Taux réduit)</SelectItem>
                      <SelectItem value="0">0% (Exonéré)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validite">Durée de validité (jours)</Label>
                  <Input
                    id="validite"
                    type="number"
                    defaultValue="30"
                    min="1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Récapitulatif */}
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total matières</span>
                    <span>{formatCurrency(montantMatieres)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total main d'œuvre</span>
                    <span>{formatCurrency(montantMainOeuvre)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total sous-traitance</span>
                    <span>{formatCurrency(montantSousTraitance)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatCurrency(sousTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Marge ({formatPercent(margeCommerciale)})
                    </span>
                    <span>{formatCurrency(montantMarge)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total HT</span>
                    <span>{formatCurrency(montantHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      TVA ({formatPercent(tauxTVA)})
                    </span>
                    <span>{formatCurrency(montantTVA)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatCurrency(montantTTC)}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates de chiffrage</CardTitle>
                  <CardDescription>
                    Modèles réutilisables pour vos devis
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{template.nom}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">
                          {template.utilisations} uses
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Éléments</span>
                          <span className="font-medium">{template.elements}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Marge par défaut</span>
                          <span className="font-medium">{template.margeCommerciale}%</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="flex-1">
                          Utiliser
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des chiffrages</CardTitle>
                  <CardDescription>
                    Consultez vos chiffrages précédents
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <History className="mr-2 h-4 w-4" />
                  Exporter l'historique
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="text-right">Montant HT</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockHistorique.map((chiffrage) => (
                      <TableRow key={chiffrage.id}>
                        <TableCell>
                          {new Date(chiffrage.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {chiffrage.reference}
                        </TableCell>
                        <TableCell>{chiffrage.client}</TableCell>
                        <TableCell>{chiffrage.projet}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(chiffrage.montantHT)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              chiffrage.statut === 'Accepté' ? 'default' :
                              chiffrage.statut === 'En attente' ? 'secondary' :
                              'destructive'
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}