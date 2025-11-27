'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageContainer,
  PageGrid,
  PageHeader,
  PageSection,
} from '@erp/ui'
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
    <PageContainer maxWidth="xl" padding="default">
      {/* Header compact avec message de bienvenue */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {t('title') || 'Tableau de bord'}
            </h1>
            <p className="text-muted-foreground">
              {t('welcomeMessage', { name: user?.prenom || user?.nom || '' }) ||
                `Bienvenue${user?.prenom ? `, ${user.prenom}` : ''}`}
            </p>
          </div>
        </div>
        {user && (
          <Badge variant="secondary" className="font-normal">
            {user.role}
          </Badge>
        )}
      </div>

      {/* Navigation Grid */}
      <PageSection spacing="default">
        <PageGrid cols={4}>
          {navigationItems.map((item) => (
            <Card
              key={item.href}
              className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              onClick={() => router?.push(item.href)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && router?.push(item.href)}
              tabIndex={0}
              role="button"
              aria-label={item.title}
            >
              <CardHeader className="pb-3">
                <div className={`p-3 ${item.color} rounded-xl w-fit mb-3 shadow-lg`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-muted-foreground group-hover:text-primary"
                >
                  {t('access') || 'Accéder'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </PageGrid>
      </PageSection>

      {/* System Info */}
      <PageSection spacing="none">
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('version') || 'Version'}: Socle 1.0</span>
              <span>
                {t('connectedAs') || 'Connecté en tant que'}: {user?.email}
              </span>
            </div>
          </CardContent>
        </Card>
      </PageSection>
    </PageContainer>
  )
}
