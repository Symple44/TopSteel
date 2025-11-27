'use client'

import { Badge, Card, CardContent, PageContainer, PageGrid, PageHeader, PageSection } from '@erp/ui'
import {
  ArrowRight,
  Database,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '../../../hooks/use-auth'
import { useTranslation } from '../../../lib/i18n/hooks'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

/**
 * Dashboard - Socle Foundation
 *
 * This is the base dashboard for the ERP socle.
 * It provides navigation to core administration features.
 * Business modules can extend this with their own dashboards.
 */
export default function Dashboard() {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router?.push('/login?redirect=/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  // Show loader while checking authentication
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  // Core navigation items for the socle
  const navigationItems = [
    {
      title: t('administration') || 'Administration',
      description: t('adminDescription') || 'Gérer les utilisateurs, rôles et permissions',
      icon: Shield,
      href: '/admin',
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
    {
      title: t('users') || 'Utilisateurs',
      description: t('usersDescription') || 'Gérer les comptes utilisateurs',
      icon: Users,
      href: '/admin/users',
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    },
    {
      title: t('settings') || 'Paramètres',
      description: t('settingsDescription') || "Configurer l'application",
      icon: Settings,
      href: '/settings',
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: t('database') || 'Base de données',
      description: t('databaseDescription') || 'Monitoring et maintenance',
      icon: Database,
      href: '/admin/database',
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
    },
  ]

  return (
    <PageContainer maxWidth="xl" padding="none">
      <PageHeader
        title={t('title') || 'Tableau de bord'}
        description={
          t('welcomeMessage', { name: user?.prenom || user?.nom || '' }) ||
          `Bienvenue${user?.prenom ? `, ${user.prenom}` : ''}`
        }
        icon={LayoutDashboard}
        iconBackground="bg-gradient-to-br from-blue-600 to-purple-600"
        badge={
          user && (
            <Badge variant="secondary" className="font-normal text-xs">
              {user.role}
            </Badge>
          )
        }
      />

      {/* Navigation Grid */}
      <PageSection spacing="default">
        <PageGrid cols={4}>
          {navigationItems.map((item) => (
            <Card
              key={item.href}
              className="group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => router?.push(item.href)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && router?.push(item.href)}
              tabIndex={0}
              role="button"
              aria-label={item.title}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center text-xs font-medium text-primary">
                  {t('access') || 'Accéder'}
                  <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </PageGrid>
      </PageSection>

      {/* System Info - compact */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
        <span>{t('version') || 'Version'}: Socle 1.0</span>
        <span>
          {t('connectedAs') || 'Connecté en tant que'}: {user?.email}
        </span>
      </div>
    </PageContainer>
  )
}
