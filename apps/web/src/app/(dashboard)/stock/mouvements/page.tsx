'use client'

import { CreateMouvementDialog } from '@/components/stocks/create-mouvement-dialog'
import { MouvementsChart } from '@/components/stocks/mouvements-chart'
import { MouvementsTable } from '@/components/stocks/mouvements-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

type Period = 'week' | 'month' | 'quarter'

interface MouvementStats {
  date: string
  name: string
  entrees: number
  sorties: number
  transferts: number
  valeurEntrees: number
  valeurSorties: number
  metadata: { 
    source: string
    version: string
    generatedAt: string 
  }
}

// ✅ Données mockées déplacées dans le composant ou constante globale
const MOCK_CHART_DATA: MouvementStats[] = [
  {
    date: '2024-01-01',
    name: 'Janvier 2024',
    entrees: 1250,
    sorties: 890,
    transferts: 165,
    valeurEntrees: 47500,
    valeurSorties: 34200,
    metadata: { source: 'mock', version: '2.1', generatedAt: new Date().toISOString() }
  },
  {
    date: '2024-02-01', 
    name: 'Février 2024',
    entrees: 1180,
    sorties: 1020,
    transferts: 220,
    valeurEntrees: 44600,
    valeurSorties: 39800,
    metadata: { source: 'mock', version: '2.1', generatedAt: new Date().toISOString() }
  },
  {
    date: '2024-03-01',
    name: 'Mars 2024', 
    entrees: 1420,
    sorties: 1150,
    transferts: 190,
    valeurEntrees: 53800,
    valeurSorties: 44500,
    metadata: { source: 'mock', version: '2.1', generatedAt: new Date().toISOString() }
  },
  {
    date: '2024-04-01',
    name: 'Avril 2024', 
    entrees: 1320,
    sorties: 1080,
    transferts: 210,
    valeurEntrees: 49800,
    valeurSorties: 43200,
    metadata: { source: 'mock', version: '2.1', generatedAt: new Date().toISOString() }
  }
]

export default function MouvementsPage() {
  // ✅ Tous les hooks dans le composant, ordre cohérent
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('tous')
  const [period, setPeriod] = useState<Period>('month')

  // ✅ Handlers optimisés avec useCallback
  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod)
  }, [])

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false)
  }, [])

  const handleOpenChangeCreateModal = useCallback((open: boolean) => {
    setShowCreateModal(open)
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  // ✅ Données calculées avec useMemo
  const stats = useMemo(() => {
    const todayEntrees = 8450
    const todaySorties = 6230
    const todayMovements = 12
    const todayExits = 8

    return {
      entrees: { amount: todayEntrees, count: todayMovements },
      sorties: { amount: todaySorties, count: todayExits }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mouvements de Stock</h1>
          <p className="text-muted-foreground">
            Historique et suivi des entrées/sorties
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleShowCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau mouvement
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Entrées aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{stats.entrees.amount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.entrees.count} mouvements
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Sorties aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              €{stats.sorties.amount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.sorties.count} mouvements
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              €{(stats.entrees.amount - stats.sorties.amount).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Solde journalier</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et données */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="tous">Tous les mouvements</TabsTrigger>
          <TabsTrigger value="entrees">Entrées</TabsTrigger>
          <TabsTrigger value="sorties">Sorties</TabsTrigger>
          <TabsTrigger value="transferts">Transferts</TabsTrigger>
        </TabsList>

        <TabsContent value="tous" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsChart 
                data={MOCK_CHART_DATA}
                period={period}
                onPeriodChange={handlePeriodChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrees">
          <Card>
            <CardHeader>
              <CardTitle>Entrées de stock</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsTable type="entrees" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sorties">
          <Card>
            <CardHeader>
              <CardTitle>Sorties de stock</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsTable type="sorties" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transferts">
          <Card>
            <CardHeader>
              <CardTitle>Transferts internes</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsTable type="transferts" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <CreateMouvementDialog
        open={showCreateModal}
        onOpenChange={handleOpenChangeCreateModal}
      />
    </div>
  )
}