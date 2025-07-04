import type { MouvementStats } from '@/types/stock'
'use client'

import { CreateMouvementDialog } from '@/components/stocks/create-mouvement-dialog'
import { MouvementsChart } from '@/components/stocks/mouvements-chart'
import { MouvementsTable } from '@/components/stocks/mouvements-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'

type Period = 'week' | 'month' | 'quarter'

    const mockChartData: MouvementStats[] = [
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
];
  const [period, setPeriod] = useState<Period>('month');
  const handlePeriodChange = (newPeriod: Period) => setPeriod(newPeriod);

export default function MouvementsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('tous')

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
          <Button onClick={() => setShowCreateModal(true)}>
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
            <div className="text-2xl font-bold text-green-600">€8,450</div>
            <p className="text-xs text-muted-foreground">12 mouvements</p>
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
            <div className="text-2xl font-bold text-red-600">€5,320</div>
            <p className="text-xs text-muted-foreground">8 mouvements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solde net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+€3,130</div>
            <p className="text-xs text-muted-foreground">Variation du jour</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique d'évolution */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          <MouvementsChart data={mockChartData} period={period} onPeriodChange={handlePeriodChange} />
        </CardContent>
      </Card>

      {/* Onglets par type de mouvement */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="entrees">Entrées</TabsTrigger>
          <TabsTrigger value="sorties">Sorties</TabsTrigger>
          <TabsTrigger value="transferts">Transferts</TabsTrigger>
          <TabsTrigger value="ajustements">Ajustements</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <MouvementsTable type={activeTab} />
        </TabsContent>
      </Tabs>

      {/* Modal création */}
      <CreateMouvementDialog 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  )
}






