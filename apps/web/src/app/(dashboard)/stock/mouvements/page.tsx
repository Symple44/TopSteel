import dynamic from 'next/dynamic'
'use client'

/**
 * 📦 PAGE MOUVEMENTS STOCK SSR-SAFE - TopSteel ERP
 * Version corrigée pour éviter les erreurs SSR/hydratation
 * Fichier: apps/web/src/app/(dashboard)/stock/mouvements/page.tsx
 */



import { ClientOnly } from '@/components/client-only'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { Download, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

// ===== TYPES =====
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

// ===== DONNÉES MOCK CONSTANTES (évite les re-renders) =====
const MOCK_CHART_DATA: MouvementStats[] = [
  {
    date: '2024-01-01',
    name: 'Janvier 2024',
    entrees: 1250,
    sorties: 890,
    transferts: 165,
    valeurEntrees: 47500,
    valeurSorties: 34200,
    metadata: { source: 'mock', version: '2.1', generatedAt: '2024-01-01T00:00:00.000Z' },
  },
  {
    date: '2024-02-01',
    name: 'Février 2024',
    entrees: 1180,
    sorties: 1020,
    transferts: 220,
    valeurEntrees: 44600,
    valeurSorties: 39800,
    metadata: { source: 'mock', version: '2.1', generatedAt: '2024-02-01T00:00:00.000Z' },
  },
  {
    date: '2024-03-01',
    name: 'Mars 2024',
    entrees: 1420,
    sorties: 1150,
    transferts: 190,
    valeurEntrees: 53800,
    valeurSorties: 44500,
    metadata: { source: 'mock', version: '2.1', generatedAt: '2024-03-01T00:00:00.000Z' },
  },
  {
    date: '2024-04-01',
    name: 'Avril 2024',
    entrees: 1320,
    sorties: 1080,
    transferts: 210,
    valeurEntrees: 49800,
    valeurSorties: 43200,
    metadata: { source: 'mock', version: '2.1', generatedAt: '2024-04-01T00:00:00.000Z' },
  },
  {
    date: '2024-05-01',
    name: 'Mai 2024',
    entrees: 1560,
    sorties: 1240,
    transferts: 185,
    valeurEntrees: 58900,
    valeurSorties: 47600,
    metadata: { source: 'mock', version: '2.1', generatedAt: '2024-05-01T00:00:00.000Z' },
  },
  {
    date: '2024-06-01',
    name: 'Juin 2024',
    entrees: 1380,
    sorties: 1190,
    transferts: 205,
    valeurEntrees: 52200,
    valeurSorties: 45800,
    metadata: { source: 'mock', version: '2.1', generatedAt: '2024-06-01T00:00:00.000Z' },
  },
]

// ===== COMPOSANTS LAZY AVEC SSR-SAFETY =====

/**
 * Composant Chart avec lazy loading pour éviter les erreurs SSR
 */
function MouvementsChartWrapper({
  data,
  period,
  onPeriodChange,
}: {
  data: MouvementStats[]
  period: Period
  onPeriodChange: (period: Period) => void
}) {
  return (
    <ClientOnly
      fallback={
        <div className="h-[300px] flex items-center justify-center">
          <div className="text-muted-foreground">Chargement du graphique...</div>
        </div>
      }
    >
      <MouvementsChart data={data} period={period} onPeriodChange={onPeriodChange} />
    </ClientOnly>
  )
}

/**
 * Composant Table avec lazy loading
 */
function MouvementsTableWrapper({ type }: { type?: string }) {
  return (
    <ClientOnly
      fallback={
        <div className="h-[200px] flex items-center justify-center">
          <div className="text-muted-foreground">Chargement du tableau...</div>
        </div>
      }
    >
      <MouvementsTable type={type} />
    </ClientOnly>
  )
}

/**
 * Dialog de création avec lazy loading
 */
function CreateMouvementDialogWrapper({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <ClientOnly>
      <CreateMouvementDialog open={open} onOpenChange={onOpenChange} />
    </ClientOnly>
  )
}

// ===== COMPOSANT PRINCIPAL =====
export default function MouvementsPage() {
  // ✅ État local optimisé
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('tous')
  const [period, setPeriod] = useState<Period>('month')

  // ✅ Handlers mémorisés avec useCallback
  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod)
  }, [])

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handleOpenChangeCreateModal = useCallback((open: boolean) => {
    setShowCreateModal(open)
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  // ✅ Données calculées avec useMemo (évite recalculs)
  const stats = useMemo(() => {
    const todayEntrees = 8450
    const todaySorties = 6230
    const todayMovements = 12
    const todayExits = 8
    const variation = ((todayEntrees - todaySorties) / todaySorties) * 100

    return {
      entrees: {
        amount: todayEntrees,
        count: todayMovements,
        variation: variation > 0 ? variation : 0,
      },
      sorties: {
        amount: todaySorties,
        count: todayExits,
        variation: Math.abs(variation),
      },
    }
  }, [])

  // ✅ Formatage des nombres mémorisé
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mouvements de Stock</h1>
          <p className="text-muted-foreground">Historique et suivi des entrées/sorties</p>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées aujourd'hui</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.entrees.amount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.entrees.count} mouvements (+{stats.entrees.variation.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties aujourd'hui</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.sorties.amount)}</div>
            <p className="text-xs text-muted-foreground">{stats.sorties.count} mouvements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.entrees.amount - stats.sorties.amount)}
            </div>
            <p className="text-xs text-muted-foreground">Différence entrées/sorties</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
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
              <MouvementsChartWrapper
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
              <MouvementsTableWrapper />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entrees">
          <Card>
            <CardHeader>
              <CardTitle>Entrées de stock</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsTableWrapper type="entrees" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sorties">
          <Card>
            <CardHeader>
              <CardTitle>Sorties de stock</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsTableWrapper type="sorties" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transferts">
          <Card>
            <CardHeader>
              <CardTitle>Transferts internes</CardTitle>
            </CardHeader>
            <CardContent>
              <MouvementsTableWrapper type="transferts" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      <CreateMouvementDialogWrapper
        open={showCreateModal}
        onOpenChange={handleOpenChangeCreateModal}
      />
    </div>
  )
}

// ===== IMPORTS DYNAMIQUES POUR ÉVITER SSR =====

/**
 * Import dynamique du composant Chart
 */
const MouvementsChart = dynamic(
  () =>
    import('@/components/stocks/mouvements-chart').then((mod) => ({
      default: mod.MouvementsChart,
    })),
  {
    
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-24 mb-2" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    ),
  }
)

/**
 * Import dynamique du composant Table
 */
const MouvementsTable = dynamic(
  () =>
    import('@/components/stocks/mouvements-table').then((mod) => ({
      default: mod.MouvementsTable,
    })),
  {
    
    loading: () => (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={`item-${i}`} className="animate-pulse">
            <div className="h-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    ),
  }
)

/**
 * Import dynamique du Dialog
 */
const CreateMouvementDialog = dynamic(
  () =>
    import('@/components/stocks/create-mouvement-dialog').then((mod) => ({
      default: mod.CreateMouvementDialog,
    })),
  {
    
  }
)


