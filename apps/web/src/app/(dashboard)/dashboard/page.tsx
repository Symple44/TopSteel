// apps/web/src/app/(dashboard)/dashboard/page.tsx
'use client'

import React from 'react'
import { StatsCard, ActivityFeed, RevenueChart } from '@erp/ui'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { TrendingUp, Package, Users, Factory } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return <div className="p-6">Chargement...</div>
  }

  const revenueData = [
    { month: 'Jan', revenue: 65000, target: 70000 },
    { month: 'Fév', revenue: 59000, target: 70000 },
    { month: 'Mar', revenue: 80000, target: 70000 },
    { month: 'Avr', revenue: 81000, target: 75000 },
    { month: 'Mai', revenue: 56000, target: 75000 },
    { month: 'Jun', revenue: 92000, target: 80000 },
  ]

  const activities = [
    {
      id: '1',
      type: 'projet_created' as const,
      title: 'Nouveau projet créé',
      description: 'Portail résidentiel - M. Dupont',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      type: 'ordre_started' as const,
      title: 'Ordre de fabrication démarré',
      description: 'OF-2024-0156 - Escalier métallique',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'stock_alert' as const,
      title: 'Alerte stock',
      description: 'Tube carré 40x40x3 - Stock critique',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Chiffre d'affaires"
          value={stats?.chiffreAffaires?.mensuel || 0}
          format="currency"
          change={stats?.chiffreAffaires?.progression || 0}
          changeType="increase"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Projets actifs"
          value={stats?.projets?.enCours || 0}
          subtitle={`${stats?.projets?.total || 0} total`}
          icon={<Package className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Clients"
          value={stats?.clients?.total || 0}
          subtitle={`${stats?.clients?.nouveaux || 0} ce mois`}
          icon={<Users className="h-4 w-4" />}
        />
        
        <StatsCard
          title="Production"
          value={`${stats?.production?.tauxOccupation || 0}%`}
          subtitle="Taux d'occupation"
          change={stats?.production?.progression || 0}
          changeType="increase"
          icon={<Factory className="h-4 w-4" />}
        />
      </div>

      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        
        <ActivityFeed activities={activities} />
      </div>
    </div>
  )
}