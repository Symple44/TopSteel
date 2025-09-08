/**
 * Page d'administration générale - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/admin/page.tsx
 */

'use client'

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import {
  ArrowRight,
  Bell,
  Building2,
  Database,
  Globe,
  Menu,
  Settings,
  Shield,
  UserCog,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n/hooks'

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
      title: t('modules?.generalConfig?.title'),
      description: t('modules?.generalConfig?.description'),
      icon: Settings,
      href: '/admin/admin',
      color: 'from-slate-500 to-gray-600',
      permissions: ['ADMIN'],
    },
    {
      title: t('modules?.users?.title'),
      description: t('modules?.users?.description'),
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-indigo-600',
      permissions: ['ADMIN', 'USER_MANAGEMENT'],
    },
    {
      title: t('modules?.roles?.title'),
      description: t('modules?.roles?.description'),
      icon: Shield,
      href: '/admin/roles',
      color: 'from-purple-500 to-pink-600',
      permissions: ['ADMIN', 'ROLE_MANAGEMENT'],
    },
    {
      title: t('modules?.sessions?.title'),
      description: t('modules?.sessions?.description'),
      icon: UserCog,
      href: '/admin/sessions',
      color: 'from-green-500 to-teal-600',
      permissions: ['ADMIN', 'SESSION_MANAGEMENT'],
    },
    {
      title: t('modules?.company?.title'),
      description: t('modules?.company?.description'),
      icon: Building2,
      href: '/admin/company',
      color: 'from-orange-500 to-red-600',
      permissions: ['ADMIN', 'COMPANY_MANAGEMENT'],
    },
    {
      title: t('modules?.menuConfig?.title'),
      description: t('modules?.menuConfig?.description'),
      icon: Menu,
      href: '/admin/menu-config',
      color: 'from-cyan-500 to-blue-600',
      permissions: ['ADMIN', 'MENU_MANAGEMENT'],
    },
    {
      title: t('modules?.database?.title'),
      description: t('modules?.database?.description'),
      icon: Database,
      href: '/admin/database',
      color: 'from-red-500 to-pink-600',
      permissions: ['ADMIN', 'DATABASE_MANAGEMENT'],
    },
    {
      title: t('modules?.notifications?.title'),
      description: t('modules?.notifications?.description'),
      icon: Bell,
      href: '/admin/notifications/rules',
      color: 'from-yellow-500 to-orange-600',
      permissions: ['ADMIN', 'NOTIFICATION_MANAGEMENT'],
    },
    {
      title: t('modules?.translations?.title'),
      description: t('modules?.translations?.description'),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/30 to-slate-100/30">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-slate-600 to-gray-700 rounded-2xl shadow-xl">
              <Settings className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-gray-600 bg-clip-text text-transparent mb-4">
            {t('title')}
          </h1>

          <p className="text-xl text-slate-600 mb-2">{t('subtitle')}</p>

          <p className="text-slate-500 mb-8">{t('description')}</p>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleModules?.map((module) => (
            <Card
              key={module.href}
              className="group cursor-pointer border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden relative"
              onClick={() => router?.push(module.href)}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${module.color}/10 opacity-0 group-hover:opacity-100 transition-opacity`}
              />

              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-lg flex items-center text-slate-800 group-hover:text-slate-900 transition-colors">
                  <div
                    className={`p-3 bg-gradient-to-r ${module.color} rounded-lg mr-3 group-hover:scale-110 transition-transform`}
                  >
                    <module.icon className="h-6 w-6 text-white" />
                  </div>
                  {module.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="relative z-10">
                <p className="text-slate-600 group-hover:text-slate-700 mb-4">
                  {module.description}
                </p>
                <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                  {t('modules.access')}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {visibleModules?.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-400 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-slate-600 mb-2">
              {t('modules?.noModules?.title')}
            </h2>
            <p className="text-slate-500">{t('modules?.noModules?.description')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
