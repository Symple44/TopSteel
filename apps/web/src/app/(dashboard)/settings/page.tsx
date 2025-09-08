/**
 * Page de paramètres utilisateur - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/settings/page.tsx
 */

'use client'

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { ArrowRight, Bell, Menu, Palette, Settings, Shield, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n/hooks'

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')
  const router = useRouter()

  // Vérifier l'authentification
  React?.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router?.push('/login?redirect=/settings')
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

  const settingsModules = [
    {
      title: t('modules?.menu?.title'),
      description: t('modules?.menu?.description'),
      icon: Menu,
      href: '/settings/menu',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: t('modules?.security?.title'),
      description: t('modules?.security?.description'),
      icon: Shield,
      href: '/settings/security',
      color: 'from-green-500 to-teal-600',
    },
    {
      title: t('modules?.notifications?.title'),
      description: t('modules?.notifications?.description'),
      icon: Bell,
      href: '/settings/notifications',
      color: 'from-yellow-500 to-orange-600',
    },
    {
      title: t('modules?.appearance?.title'),
      description: t('modules?.appearance?.description'),
      icon: Palette,
      href: '/settings/appearance',
      color: 'from-indigo-500 to-purple-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/30">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl">
              <Settings className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-purple-600 bg-clip-text text-transparent mb-4">
            {t('title')}
          </h1>

          <p className="text-xl text-slate-600 mb-2">{t('subtitle')}</p>

          <p className="text-slate-500 mb-8">{t('description')}</p>

          {user && (
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/20">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-slate-700 font-medium">
                {t('connectedAs')}{' '}
                <span className="text-blue-600">
                  {user.prenom} {user.nom}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Settings Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsModules?.map((module) => (
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
                  {t('modules.configure')}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Info Card */}
        {user && (
          <div className="mt-16">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 flex items-center">
                  <User className="h-6 w-6 mr-3 text-blue-600" />
                  {t('accountInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">{t('fullName')}</span>
                    <div className="font-medium text-slate-800">
                      {user.prenom} {user.nom}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">{t('email')}</span>
                    <div className="font-medium text-slate-800">{user.email}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{t('role')}</span>
                    <div className="font-medium text-slate-800">{user.role}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">{t('status')}</span>
                    <div className="font-medium text-green-600">{t('active')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
