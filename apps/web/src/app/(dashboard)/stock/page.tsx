'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, ArrowUpDown, BarChart3, Download, Package, Plus, Search, TrendingUp } from 'lucide-react'
import { useState } from 'react'

// Types pour les stocks
interface StockProduit {
  id: string
  reference: string
  designation: string
  categorie: 'profile' | 'tube' | 'tole' | 'consommable' | 'accessoire' | 'quincaillerie'
  unite: string
  prixAchat: number
  prixVente: number
}

interface Stock {
  id: string
  produit: StockProduit
  quantiteDisponible: number
  quantiteReservee: number
  quantiteMinimale: number
  emplacement: string
}

// Données mock
const mockStocks: Stock[] = [
  {
    id: '1',
    produit: {
      id: '1',
      reference: 'IPE-200',
      designation: 'Poutre IPE 200',
      categorie: 'profile',
      unite: 'm',
      prixAchat: 25,
      prixVente: 35,
    },
    quantiteDisponible: 150,
    quantiteReservee: 25,
    quantiteMinimale: 50,
    emplacement: 'A-01-1',
  },
  {
    id: '2',
    produit: {
      id: '2',
      reference: 'TUBE-40x40',
      designation: 'Tube carré 40x40x3',
      categorie: 'tube',
      unite: 'm',
      prixAchat: 8,
      prixVente: 12,
    },
    quantiteDisponible: 200,
    quantiteReservee: 50,
    quantiteMinimale: 100,
    emplacement: 'B-02-1',
  },
  {
    id: '3',
    produit: {
      id: '3',
      reference: 'TOLE-5MM',
      designation: 'Tôle acier 5mm',
      categorie: 'tole',
      unite: 'm²',
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

// ✅ FIX: Définition stricte du mapping des catégories avec types explicites
const categorieColors: Record<string, string> = {
  profile: '#3B82F6',
  tube: '#10B981', 
  tole: '#F59E0B',
  consommable: '#EF4444',
  accessoire: '#8B5CF6',
  quincaillerie: '#6B7280'
}

// ✅ FIX: Labels des catégories avec type strict
const categorieLabels: Record<string, string> = {
  profile: 'Profilé',
  tube: 'Tube',
  tole: 'Tôle',
  consommable: 'Consommable',
  accessoire: 'Accessoire',
  quincaillerie: 'Quincaillerie'
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

  // ✅ FIX: Type explicite pour le paramètre stock
  const getStockStatus = (stock: Stock): { status: string; color: 'destructive' | 'secondary' | 'default' } => {
    if (stock.quantiteDisponible <= 0) return { status: 'rupture', color: 'destructive' }
    if (stock.quantiteDisponible <= stock.quantiteMinimale) return { status: 'alerte', color: 'secondary' }
    return { status: 'normal', color: 'default' }
  }

  // Fonction helper pour récupérer le label d'une catégorie avec fallback
  const getCategorieLabel = (categorie: string): string => {
    return categorieLabels[categorie] || categorie
  }

  // Fonction helper pour récupérer la couleur d'une catégorie avec fallback
  const getCategorieColor = (categorie: string): string => {
    return categorieColors[categorie] || '#6B7280'
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
                    variant={showAlertes ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowAlertes(!showAlertes)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {showAlertes ? 'Toutes' : 'Alertes'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* ✅ FIX: Remplacement du Select par un select HTML natif pour éviter l'erreur TypeScript */}
                <div className="w-[200px]">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="tous">Toutes catégories</option>
                    <option value="profile">Profilés</option>
                    <option value="tube">Tubes</option>
                    <option value="tole">Tôles</option>
                    <option value="consommable">Consommables</option>
                    <option value="accessoire">Accessoires</option>
                    <option value="quincaillerie">Quincaillerie</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Désignation</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Stock disponible</TableHead>
                      <TableHead>Stock réservé</TableHead>
                      <TableHead>Stock minimal</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead>Valeur stock</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => {
                      const status = getStockStatus(stock)
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">
                            {stock.produit.reference}
                          </TableCell>
                          <TableCell>{stock.produit.designation}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              style={{ 
                                backgroundColor: `${getCategorieColor(stock.produit.categorie)}20`,
                                borderColor: getCategorieColor(stock.produit.categorie),
                                color: getCategorieColor(stock.produit.categorie)
                              }}
                            >
                              {/* ✅ FIX: Utilisation de la fonction helper avec fallback */}
                              {getCategorieLabel(stock.produit.categorie)}
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