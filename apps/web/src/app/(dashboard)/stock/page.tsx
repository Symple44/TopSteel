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

// Données mockées pour la démonstration
const mockStocks = [
  {
    id: '1',
    produit: {
      id: '1',
      reference: 'IPE200-6M',
      designation: 'Poutre IPE 200 - 6m',
      categorie: 'profile',
      unite: 'piece',
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
      categorie: 'tube',
      unite: 'piece',
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
      categorie: 'tole',
      unite: 'm2',
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
      categorie: 'consommable',
      unite: 'kg',
      prixAchat: 12,
      prixVente: 18,
    },
    quantiteDisponible: 45,
    quantiteReservee: 5,
    quantiteMinimale: 25,
    emplacement: 'D-08-1',
  }
]

const categorieColors = {
  profile: '#3B82F6',
  tube: '#10B981', 
  tole: '#F59E0B',
  consommable: '#EF4444',
  accessoire: '#8B5CF6',
  quincaillerie: '#6B7280'
}

export default function StockPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('tous')
  const [showAlertes, setShowAlertes] = useState(false)

  const filteredStocks = mockStocks.filter(stock => {
    const matchesSearch = stock.produit.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.produit.reference.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'tous' || stock.produit.categorie === selectedCategory
    const matchesAlertes = !showAlertes || stock.quantiteDisponible <= stock.quantiteMinimale
    
    return matchesSearch && matchesCategory && matchesAlertes
  })

  const getStockStatus = (stock) => {
    if (stock.quantiteDisponible <= 0) return { status: 'rupture', color: 'destructive' }
    if (stock.quantiteDisponible <= stock.quantiteMinimale) return { status: 'alerte', color: 'secondary' }
    return { status: 'normal', color: 'default' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Gestion des stocks
          </h1>
          <p className="text-muted-foreground">
            Suivi et gestion des stocks de matériaux et consommables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Rapports
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <div className="text-sm font-medium">Produits en stock</div>
            </div>
            <div className="text-2xl font-bold">{mockStocks.length}</div>
            <div className="text-xs text-muted-foreground">+2 ce mois</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <div className="text-sm font-medium">Alertes stock</div>
            </div>
            <div className="text-2xl font-bold">2</div>
            <div className="text-xs text-muted-foreground">Seuils atteints</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <div className="text-sm font-medium">Valeur totale</div>
            </div>
            <div className="text-2xl font-bold">45 230 €</div>
            <div className="text-xs text-muted-foreground">+5% vs mois dernier</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <div className="text-sm font-medium">Mouvements</div>
            </div>
            <div className="text-2xl font-bold">127</div>
            <div className="text-xs text-muted-foreground">Ce mois</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stock">Stock actuel</TabsTrigger>
          <TabsTrigger value="mouvements">Mouvements</TabsTrigger>
          <TabsTrigger value="inventaire">Inventaire</TabsTrigger>
          <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock des produits</CardTitle>
                  <CardDescription>
                    Vue d'ensemble des stocks disponibles et réservés
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showAlertes ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAlertes(!showAlertes)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Alertes uniquement
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Toutes catégories</SelectItem>
                    <SelectItem value="profile">Profilé</SelectItem>
                    <SelectItem value="tole">Tôle</SelectItem>
                    <SelectItem value="tube">Tube</SelectItem>
                    <SelectItem value="accessoire">Accessoire</SelectItem>
                    <SelectItem value="consommable">Consommable</SelectItem>
                    <SelectItem value="quincaillerie">Quincaillerie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Stock dispo</TableHead>
                      <TableHead>Réservé</TableHead>
                      <TableHead>Seuil min</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => {
                      const status = getStockStatus(stock)
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{stock.produit.reference}</div>
                              <div className="text-sm text-muted-foreground">
                                {stock.produit.designation}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: categorieColors[stock.produit.categorie],
                                color: categorieColors[stock.produit.categorie]
                              }}
                            >
                              {stock.produit.categorie}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {stock.quantiteDisponible} {stock.produit.unite}
                            </div>
                          </TableCell>
                          <TableCell>
                            {stock.quantiteReservee} {stock.produit.unite}
                          </TableCell>
                          <TableCell>
                            {stock.quantiteMinimale} {stock.produit.unite}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{stock.emplacement}</code>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(stock.quantiteDisponible * stock.produit.prixAchat)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.color}>
                              {status.status === 'rupture' && 'Rupture'}
                              {status.status === 'alerte' && 'Alerte'}
                              {status.status === 'normal' && 'Normal'}
                            </Badge>
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

        <TabsContent value="mouvements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mouvements de stock</CardTitle>
              <CardDescription>
                Historique des entrées et sorties de stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Fonctionnalité en cours de développement...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventaire" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventaire</CardTitle>
              <CardDescription>
                Gestion des inventaires et comptages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Fonctionnalité en cours de développement...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fournisseurs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fournisseurs</CardTitle>
              <CardDescription>
                Gestion des fournisseurs et approvisionnements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Fonctionnalité en cours de développement...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

