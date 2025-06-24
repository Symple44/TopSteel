'use client'

import { useState } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Download,
  BarChart3,
  ArrowUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { formatNumber, formatCurrency, cn } from '@/lib/utils'
import { CategorieProduit, UniteMesure } from '@/types'

// Données mockées pour la démonstration
const mockStocks = [
  {
    id: '1',
    produit: {
      id: '1',
      reference: 'IPE200-6M',
      designation: 'Poutre IPE 200 - 6m',
      categorie: CategorieProduit.PROFILE,
      unite: UniteMesure.PIECE,
      prixAchat: 245,
      prixVente: 320,
    },
    quantiteDisponible: 12,
    quantiteReservee: 8,
    quantiteMinimale: 10,
    emplacement: 'A-12-3',
  },
  {
    id: '2',
    produit: {
      id: '2',
      reference: 'TUBE-40X40-3',
      designation: 'Tube carré 40x40x3mm - 6m',
      categorie: CategorieProduit.TUBE,
      unite: UniteMesure.PIECE,
      prixAchat: 48,
      prixVente: 65,
    },
    quantiteDisponible: 5,
    quantiteReservee: 2,
    quantiteMinimale: 20,
    emplacement: 'B-05-2',
  },
  {
    id: '3',
    produit: {
      id: '3',
      reference: 'TOLE-3MM',
      designation: 'Tôle acier 3mm - 2000x1000',
      categorie: CategorieProduit.TOLE,
      unite: UniteMesure.METRE_CARRE,
      prixAchat: 35,
      prixVente: 45,
    },
    quantiteDisponible: 85,
    quantiteReservee: 15,
    quantiteMinimale: 50,
    emplacement: 'C-01-1',
  },
  {
    id: '4',
    produit: {
      id: '4',
      reference: 'ELEC-INOX',
      designation: 'Électrodes inox 3.2mm',
      categorie: CategorieProduit.CONSOMMABLE,
      unite: UniteMesure.KILOGRAMME,
      prixAchat: 12,
      prixVente: 18,
    },
    quantiteDisponible: 45,
    quantiteReservee: 0,
    quantiteMinimale: 20,
    emplacement: 'D-08-4',
  },
]

const mockMouvements = [
  {
    id: '1',
    date: new Date('2025-06-16T10:30:00'),
    type: 'ENTREE',
    produit: 'Poutre IPE 200 - 6m',
    quantite: 20,
    reference: 'BL-2025-0456',
    motif: 'Réception commande fournisseur',
    utilisateur: 'Jean Dupont',
  },
  {
    id: '2',
    date: new Date('2025-06-16T14:20:00'),
    type: 'SORTIE',
    produit: 'Tube carré 40x40x3mm - 6m',
    quantite: 15,
    reference: 'PRJ-2025-0142',
    motif: 'Sortie pour projet',
    utilisateur: 'Pierre Martin',
  },
  {
    id: '3',
    date: new Date('2025-06-15T09:00:00'),
    type: 'AJUSTEMENT',
    produit: 'Tôle acier 3mm - 2000x1000',
    quantite: -5,
    reference: 'INV-2025-06',
    motif: 'Correction inventaire',
    utilisateur: 'Marie Leblanc',
  },
]

export default function StocksPage() {
  const [activeTab, setActiveTab] = useState('inventaire')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategorie, setFilterCategorie] = useState<string>('tous')
  const [showCritiqueOnly, setShowCritiqueOnly] = useState(false)

  const stocksCritiques = mockStocks.filter(
    stock => stock.quantiteDisponible <= stock.quantiteMinimale
  )

  const filteredStocks = mockStocks.filter((stock) => {
    const matchSearch = 
      stock.produit.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.produit.designation.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchCategorie = filterCategorie === 'tous' || stock.produit.categorie === filterCategorie
    const matchCritique = !showCritiqueOnly || stock.quantiteDisponible <= stock.quantiteMinimale
    
    return matchSearch && matchCategorie && matchCritique
  })

  const getStockStatus = (disponible: number, minimum: number) => {
    const ratio = disponible / minimum
    if (ratio <= 0.5) return { label: 'Critique', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (ratio <= 1) return { label: 'Bas', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { label: 'Normal', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const getCategorieBadge = (categorie: CategorieProduit) => {
    const categorieLabels = {
      [CategorieProduit.PROFILE]: 'Profilé',
      [CategorieProduit.TOLE]: 'Tôle',
      [CategorieProduit.TUBE]: 'Tube',
      [CategorieProduit.ACCESSOIRE]: 'Accessoire',
      [CategorieProduit.CONSOMMABLE]: 'Consommable',
      [CategorieProduit.QUINCAILLERIE]: 'Quincaillerie',
    }
    
    return <Badge variant="outline">{categorieLabels[categorie]}</Badge>
  }

  const getMouvementIcon = (type: string) => {
    switch (type) {
      case 'ENTREE':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'SORTIE':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'AJUSTEMENT':
        return <ArrowUpDown className="h-4 w-4 text-blue-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const valeurStock = filteredStocks.reduce(
    (total, stock) => total + (stock.quantiteDisponible * stock.produit.prixAchat),
    0
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des stocks</h1>
          <p className="text-muted-foreground">
            Gérez vos stocks de matières premières et produits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Entrée de stock
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur du stock</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valeurStock)}</div>
            <p className="text-xs text-muted-foreground">
              Prix d'achat total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStocks.length}</div>
            <p className="text-xs text-muted-foreground">
              Références différentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stocks critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stocksCritiques.length}</div>
            <p className="text-xs text-muted-foreground">
              À réapprovisionner
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de rotation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2</div>
            <p className="text-xs text-muted-foreground">
              Fois par mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes stocks critiques */}
      {stocksCritiques.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Stocks critiques
            </CardTitle>
            <CardDescription className="text-red-700">
              Ces produits nécessitent un réapprovisionnement urgent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stocksCritiques.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{stock.produit.designation}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {stock.quantiteDisponible} / Min: {stock.quantiteMinimale}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive">
                    Commander
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de contenu */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventaire">Inventaire</TabsTrigger>
          <TabsTrigger value="mouvements">Mouvements</TabsTrigger>
          <TabsTrigger value="chutes">Gestion des chutes</TabsTrigger>
        </TabsList>

        <TabsContent value="inventaire" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterCategorie} onValueChange={setFilterCategorie}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue /><SelectTrigger><SelectValue  /><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger></SelectTrigger>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes les catégories</SelectItem>
                    <SelectItem value={CategorieProduit.PROFILE}>Profilés</SelectItem>
                    <SelectItem value={CategorieProduit.TOLE}>Tôles</SelectItem>
                    <SelectItem value={CategorieProduit.TUBE}>Tubes</SelectItem>
                    <SelectItem value={CategorieProduit.ACCESSOIRE}>Accessoires</SelectItem>
                    <SelectItem value={CategorieProduit.CONSOMMABLE}>Consommables</SelectItem>
                    <SelectItem value={CategorieProduit.QUINCAILLERIE}>Quincaillerie</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showCritiqueOnly ? "destructive" : "outline"}
                  onClick={() => setShowCritiqueOnly(!showCritiqueOnly)}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Stocks critiques
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des stocks */}
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Désignation</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-center">Disponible</TableHead>
                      <TableHead className="text-center">Réservé</TableHead>
                      <TableHead className="text-center">Minimum</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead className="text-right">Valeur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => {
                      const status = getStockStatus(stock.quantiteDisponible, stock.quantiteMinimale)
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">{stock.produit.reference}</TableCell>
                          <TableCell>{stock.produit.designation}</TableCell>
                          <TableCell>{getCategorieBadge(stock.produit.categorie)}</TableCell>
                          <TableCell className="text-center font-medium">
                            {formatNumber(stock.quantiteDisponible)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatNumber(stock.quantiteReservee)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatNumber(stock.quantiteMinimale)}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              status.bgColor,
                              status.color
                            )}>
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell>{stock.emplacement}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(stock.quantiteDisponible * stock.produit.prixAchat)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mouvements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
              <CardDescription>
                Suivi des entrées et sorties de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMouvements.map((mouvement) => (
                  <div key={mouvement.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="mt-1">
                      {getMouvementIcon(mouvement.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{mouvement.produit}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {mouvement.type === 'ENTREE' && `+${mouvement.quantite}`}
                            {mouvement.type === 'SORTIE' && `-${mouvement.quantite}`}
                            {mouvement.type === 'AJUSTEMENT' && `${mouvement.quantite > 0 ? '+' : ''}${mouvement.quantite}`}
                            {' unités - '}
                            {mouvement.motif}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Référence: {mouvement.reference} • Par {mouvement.utilisateur}
                          </p>
                        </div>
                        <time className="text-sm text-muted-foreground">
                          {new Date(mouvement.date).toLocaleString('fr-FR')}
                        </time>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chutes" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Gestion des chutes</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Module de gestion et d'optimisation des chutes de matériaux
              </p>
              <Button className="mt-4">
                Configurer le module
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
