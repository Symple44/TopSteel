/**
 * Page d'administration générale - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/admin/page.tsx
 */

'use client'

export const dynamic = 'force-dynamic'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageContainer,
  PageGrid,
  PageHeader,
  PageSection,
} from '@erp/ui'
import {
  ArrowRight,
  Bell,
  Building2,
  Database,
  Globe,
  Lock,
  Menu,
  Settings,
  Shield,
  UserCog,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '../../../hooks/use-auth'
import { useTranslation } from '../../../lib/i18n/hooks'

export default function AdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useTranslation('admin')
  const { t: tCommon } = useTranslation('common')
  const router = useRouter()

  // Vérifier l'authentification
  React?.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router?.push('/login?redirect=/admin')
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

  const adminModules = [
    {
      title: t('modules.generalConfig.title'),
      description: t('modules.generalConfig.description'),
      icon: Settings,
      href: '/admin/admin',
      color: 'from-slate-500 to-gray-600',
      permissions: ['ADMIN'],
    },
    {
      title: t('modules.users.title'),
      description: t('modules.users.description'),
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-indigo-600',
      permissions: ['ADMIN', 'USER_MANAGEMENT'],
    },
    {
      title: t('modules.roles.title'),
      description: t('modules.roles.description'),
      icon: Shield,
      href: '/admin/roles',
      color: 'from-purple-500 to-pink-600',
      permissions: ['ADMIN', 'ROLE_MANAGEMENT'],
    },
    {
      title: t('modules.sessions.title'),
      description: t('modules.sessions.description'),
      icon: UserCog,
      href: '/admin/sessions',
      color: 'from-green-500 to-teal-600',
      permissions: ['ADMIN', 'SESSION_MANAGEMENT'],
    },
    {
      title: t('modules.company.title'),
      description: t('modules.company.description'),
      icon: Building2,
      href: '/admin/company',
      color: 'from-orange-500 to-red-600',
      permissions: ['ADMIN', 'COMPANY_MANAGEMENT'],
    },
    {
      title: t('modules.menuConfig.title'),
      description: t('modules.menuConfig.description'),
      icon: Menu,
      href: '/admin/menu-config',
      color: 'from-cyan-500 to-blue-600',
      permissions: ['ADMIN', 'MENU_MANAGEMENT'],
    },
    {
      title: t('modules.database.title'),
      description: t('modules.database.description'),
      icon: Database,
      href: '/admin/database',
      color: 'from-red-500 to-pink-600',
      permissions: ['ADMIN', 'DATABASE_MANAGEMENT'],
    },
    {
      title: t('modules.notifications.title'),
      description: t('modules.notifications.description'),
      icon: Bell,
      href: '/admin/notifications/rules',
      color: 'from-yellow-500 to-orange-600',
      permissions: ['ADMIN', 'NOTIFICATION_MANAGEMENT'],
    },
    {
      title: t('modules.translations.title'),
      description: t('modules.translations.description'),
      icon: Globe,
      href: '/admin/translations',
      color: 'from-emerald-500 to-green-600',
      permissions: ['ADMIN', 'TRANSLATION_MANAGEMENT'],
    },
  ]

  // Filtrer les modules selon les permissions de l'utilisateur
  const visibleModules = adminModules?.filter((module) => {
    if (!user?.permissions && user?.role !== 'ADMIN') return false
    return module?.permissions?.some(
      (permission) => user.role === 'ADMIN' || user.permissions?.includes(permission)
    )
  })

  return (
    <PageContainer maxWidth="xl" padding="default">
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Settings}
        iconBackground="bg-gradient-to-br from-slate-600 to-gray-700"
      />

      <PageSection
        title={t('modules.title') || 'Modules'}
        description={t('subtitle')}
        count={visibleModules?.length}
      >
        {visibleModules?.length === 0 ? (
          <EmptyState
            icon={<Lock className="h-12 w-12" />}
            title={t('modules.noModules.title')}
            description={t('modules.noModules.description')}
          />
        ) : (
          <PageGrid cols={3}>
            {visibleModules?.map((module) => (
              <Card
                key={module.href}
                className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                onClick={() => router?.push(module.href)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-foreground group-hover:text-primary transition-colors">
                    <div
                      className={`p-3 bg-gradient-to-r ${module.color} rounded-xl mr-3 shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    {module.title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground mb-4">{module.description}</p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    {t('modules.access')}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </PageGrid>
        )}
      </PageSection>
    </PageContainer>
  )
}
