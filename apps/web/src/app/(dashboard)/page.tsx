/**
 * Page d'accueil - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/page.tsx
 */

'use client'

export const dynamic = 'force-dynamic'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageContainer,
  PageSection,
} from '@erp/ui'
import {
  ArrowRight,
  BarChart3,
  Building2,
  Factory,
  FolderOpen,
  Package,
  Settings,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { CompanyLogoWrapper as CompanyLogo } from '../../components/wrappers'
import { useAuth } from '../../hooks/use-auth'
import { useCompanyInfo } from '../../hooks/use-company-info'
import { useTranslation } from '../../lib/i18n/hooks'

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { companyInfo } = useCompanyInfo()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const router = useRouter()

  // Vérifier l'authentification - mais ne pas rediriger vers dashboard
  React?.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router?.push('/login?redirect=/')
    }
  }, [isAuthenticated, authLoading, router])

  // Afficher un loader si pas encore authentifié
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: t('actions.dashboard.title'),
      description: t('actions.dashboard.description'),
      icon: BarChart3,
      href: '/dashboard',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: t('actions.newProject.title'),
      description: t('actions.newProject.description'),
      icon: FolderOpen,
      href: '/projects/new',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: t('actions.production.title'),
      description: t('actions.production.description'),
      icon: Factory,
      href: '/production',
      color: 'from-orange-500 to-red-600',
    },
    {
      title: t('actions.inventory.title'),
      description: t('actions.inventory.description'),
      icon: Package,
      href: '/inventory',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: t('actions.users.title'),
      description: t('actions.users.description'),
      icon: Users,
      href: '/admin/users',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      title: t('actions.configuration.title'),
      description: t('actions.configuration.description'),
      icon: Settings,
      href: '/admin',
      color: 'from-slate-500 to-gray-600',
    },
  ]

  return (
    <PageContainer maxWidth="full" padding="default">
      <PageSection spacing="default">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <CompanyLogo size="xl" showCompanyName={false} className="drop-shadow-xl" />
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('welcome', { companyName: companyInfo?.name || 'TopSteel' })}
          </h1>

          <p className="text-xl text-muted-foreground mb-2">{t('subtitle')}</p>

          <p className="text-muted-foreground mb-8">{t('description')}</p>

          <div className="flex justify-center gap-4">
            <Button
              type="button"
              onClick={() => router?.push('/dashboard')}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              {t('accessDashboard')}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router?.push('/admin/company')}
            >
              <Building2 className="mr-2 h-5 w-5" />
              {t('configureCompany')}
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            {t('quickActionsTitle')}
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quickActions?.map((action) => (
              <button
                key={action.href}
                type="button"
                onClick={() => router?.push(action.href)}
                aria-label={`Navigate to ${action.title}`}
                className="block w-full text-left"
              >
                <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden relative h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center text-foreground">
                      <div
                        className={`p-3 bg-gradient-to-r ${action.color} rounded-lg mr-3 group-hover:scale-110 transition-transform`}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      {action.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {action.description}
                    </p>
                    <div className="flex items-center text-sm font-medium text-primary">
                      {t('actions.access')}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </PageSection>
    </PageContainer>
  )
}
