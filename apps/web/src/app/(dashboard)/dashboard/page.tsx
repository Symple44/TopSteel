'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
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
import { CompanyLogoWrapper as CompanyLogo } from '../../../components/wrappers'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>{t('loading') || "Vérification de l'authentification..."}</p>
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
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: t('users') || 'Utilisateurs',
      description: t('usersDescription') || 'Gérer les comptes utilisateurs',
      icon: Users,
      href: '/admin/users',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: t('settings') || 'Paramètres',
      description: t('settingsDescription') || 'Configurer l\'application',
      icon: Settings,
      href: '/settings',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: t('database') || 'Base de données',
      description: t('databaseDescription') || 'Monitoring et maintenance',
      icon: Database,
      href: '/admin/database',
      color: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CompanyLogo size="lg" showCompanyName={false} className="flex-shrink-0" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                {t('title') || 'Tableau de bord'}
              </h1>
              <p className="text-slate-600 mt-1">
                {t('welcomeMessage', { name: user?.prenom || user?.nom || '' }) ||
                  `Bienvenue${user?.prenom ? `, ${user.prenom}` : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <LayoutDashboard className="mr-3 h-6 w-6" />
              {t('socleTitle') || 'TopSteel ERP - Socle'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-100 text-lg">
              {t('socleDescription') ||
                'Bienvenue sur la plateforme ERP. Utilisez les modules ci-dessous pour gérer votre organisation.'}
            </p>
          </CardContent>
        </Card>

        {/* Navigation Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {navigationItems.map((item) => (
            <Card
              key={item.href}
              className="group border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
              onClick={() => router?.push(item.href)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && router?.push(item.href)}
              tabIndex={0}
              role="button"
              aria-label={item.title}
            >
              <CardHeader className="pb-3">
                <div className={`p-3 bg-gradient-to-r ${item.color} rounded-lg w-fit mb-3`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-slate-800 group-hover:text-slate-900">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-slate-500 group-hover:text-blue-600"
                >
                  {t('access') || 'Accéder'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Info */}
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{t('version') || 'Version'}: Socle 1.0</span>
              <span>
                {t('connectedAs') || 'Connecté en tant que'}: {user?.email}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
