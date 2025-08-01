'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar as CalendarIcon,
  Clock,
  Euro,
  Factory,
  FolderOpen,
  Package,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { CompanyLogoWrapper as CompanyLogo } from '@/components/wrappers'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n/hooks'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

// Types pour les données du dashboard
interface DashboardStats {
  projets: {
    total: number
    enCours: number
    termines: number
    enRetard: number
  }
  chiffreAffaires: {
    mensuel: number
    annuel: number
    objectif: number
    progression: number
  }
  production: {
    ordresEnCours: number
    ordresEnRetard: number
    tauxOccupation: number
    efficacite: number
  }
  stocks: {
    alertes: number
    ruptures: number
    valeurTotale: number
    mouvements: number
  }
}

interface RecentActivity {
  id: string
  type: 'projet' | 'production' | 'stock' | 'facture'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export default function Dashboard() {
  const { t } = useTranslation('dashboard')
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [activities, setActivities] = React.useState<RecentActivity[]>([])
  const [loading, setLoading] = React.useState(true)

  // Vérifier l'authentification
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  // Data simulation (to be replaced by API calls)
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      // API call simulation
      setTimeout(() => {
        setStats({
          projets: {
            total: 47,
            enCours: 12,
            termines: 32,
            enRetard: 3,
          },
          chiffreAffaires: {
            mensuel: 285000,
            annuel: 2340000,
            objectif: 3000000,
            progression: 78,
          },
          production: {
            ordresEnCours: 8,
            ordresEnRetard: 2,
            tauxOccupation: 85,
            efficacite: 92,
          },
          stocks: {
            alertes: 5,
            ruptures: 2,
            valeurTotale: 145000,
            mouvements: 23,
          },
        })

        setActivities([
          {
            id: '1',
            type: 'projet',
            title: t('newProjectCreated'),
            description: 'PRJ-2025-007 - Hangar agricole Dupont',
            timestamp: t('hoursAgo', { hours: 2 }),
            status: 'success',
          },
          {
            id: '2',
            type: 'production',
            title: t('productionOrderCompleted'),
            description: 'OF-2025-023 - Portail coulissant',
            timestamp: t('hoursAgo', { hours: 4 }),
            status: 'success',
          },
          {
            id: '3',
            type: 'stock',
            title: t('lowStockDetected'),
            description: `Profilé IPE 200 - ${t('remainingUnits', { units: 5 })}`,
            timestamp: t('hoursAgo', { hours: 6 }),
            status: 'warning',
          },
          {
            id: '4',
            type: 'facture',
            title: t('unpaidInvoice'),
            description: 'FACT-2024-156 - Client Martin (30j)',
            timestamp: t('dayAgo', { days: 1 }),
            status: 'error',
          },
        ])

        setLoading(false)
      }, 1000)
    }

    fetchDashboardData()
  }, [t])

  // Afficher un loader si pas encore authentifié
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('loading') || "Vérification de l'authentification..."}</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'projet':
        return <FolderOpen className="h-4 w-4" />
      case 'production':
        return <Factory className="h-4 w-4" />
      case 'stock':
        return <Package className="h-4 w-4" />
      case 'facture':
        return <Euro className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="space-y-8 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card
                key={`loading-card-${i}`}
                className="animate-pulse border-0 bg-white/80 backdrop-blur-sm shadow-xl"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CompanyLogo size="lg" showName={false} className="flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="text-slate-600 mt-1">{t('overview')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-600" />
              {t('thisWeek')}
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('reports')}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Projets actifs */}
          <Card className="group border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">
                {t('activeProjects')}
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats.projets.enCours}</div>
              <div className="flex items-center text-sm text-emerald-100">
                {stats.projets.enRetard > 0 ? (
                  <>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {stats.projets.enRetard} {t('delayedProjects')}
                  </>
                ) : (
                  <>
                    <Shield className="mr-1 h-3 w-3" />
                    {t('noDelays')}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chiffre d'affaires */}
          <Card className="group border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                {t('monthlyRevenue')}
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Euro className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {formatCurrency(stats.chiffreAffaires.mensuel)}
              </div>
              <div className="flex items-center text-sm text-blue-100">
                <TrendingUp className="mr-1 h-3 w-3 text-green-300" />
                {t('vsLastMonth')}
              </div>
            </CardContent>
          </Card>

          {/* Production */}
          <Card className="group border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                {t('occupancyRate')}
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Factory className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.production.tauxOccupation}%</div>
              <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${stats.production.tauxOccupation}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stocks */}
          <Card className="group border-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                {t('stockAlerts')}
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats.stocks.alertes}</div>
              <div className="flex items-center text-sm text-purple-100">
                <AlertTriangle className="mr-1 h-3 w-3 text-yellow-300" />
                {stats.stocks.ruptures} {t('stockBreaks')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts et détails */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Progression annuelle */}
          <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    {t('annualProgress')}
                  </CardTitle>
                  <p className="text-slate-600 text-sm mt-1">{t('revenueEvolution')}</p>
                </div>
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{t('objective2025')}</span>
                  <span className="text-slate-600">
                    {formatCurrency(stats.chiffreAffaires.objectif)}
                  </span>
                </div>
                <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${stats.chiffreAffaires.progression}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {formatCurrency(stats.chiffreAffaires.annuel)} {t('achieved')}
                  </span>
                  <span className="font-medium text-slate-800">
                    {stats.chiffreAffaires.progression}%
                  </span>
                </div>
              </div>

              {/* Graphique moderne avec barres colorées */}
              <div className="mt-8 h-40 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl flex items-end justify-center p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="flex items-end space-x-3 h-full relative z-10">
                  {[45, 65, 52, 78, 88, 67, 92, 85, 72, 68, 89, 95].map((height, i) => (
                    <div
                      key={`chart-bar-${i}`}
                      className="rounded-t-lg transition-all duration-700 hover:scale-110 cursor-pointer"
                      style={{
                        height: `${height}%`,
                        width: '20px',
                        background: `linear-gradient(to top, hsl(${220 + i * 15}, 70%, ${50 + height * 0.3}%), hsl(${240 + i * 10}, 80%, ${60 + height * 0.2}%))`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-800">
                    {t('recentActivity')}
                  </CardTitle>
                  <p className="text-slate-600 text-sm mt-1">{t('lastActions')}</p>
                </div>
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 group">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r ${
                          activity.status === 'success'
                            ? 'from-emerald-500 to-teal-500'
                            : activity.status === 'warning'
                              ? 'from-orange-500 to-yellow-500'
                              : activity.status === 'error'
                                ? 'from-red-500 to-pink-500'
                                : 'from-blue-500 to-indigo-500'
                        } text-white`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-slate-600">{activity.description}</p>
                      <p className="text-xs text-slate-500 flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white group"
                >
                  {t('viewAllActivity')}
                  <ArrowUpRight className="ml-2 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group cursor-pointer border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-base flex items-center text-slate-800 group-hover:text-emerald-600 transition-colors">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
                {t('newProject')}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-sm text-slate-600 group-hover:text-slate-700">
                {t('createNewProject')}
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-base flex items-center text-slate-800 group-hover:text-orange-600 transition-colors">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                  <Factory className="h-5 w-5 text-white" />
                </div>
                {t('productionOrder')}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-sm text-slate-600 group-hover:text-slate-700">
                {t('launchProductionOrder')}
              </p>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-base flex items-center text-slate-800 group-hover:text-blue-600 transition-colors">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                  <Euro className="h-5 w-5 text-white" />
                </div>
                {t('newQuote')}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-sm text-slate-600 group-hover:text-slate-700">
                {t('createQuoteForClient')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
