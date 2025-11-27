/**
 * Page de paramètres utilisateur - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/settings/page.tsx
 */

'use client'

export const dynamic = 'force-dynamic'

import {
  Badge,
  Card,
  CardContent,
  PageContainer,
  PageGrid,
  PageHeader,
  PageSection,
} from '@erp/ui'
import { Bell, Menu, Palette, Settings, Shield, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '../../../hooks/use-auth'
import { useTranslation } from '../../../lib/i18n/hooks'

interface SettingsModule {
  title: string
  description: string
  icon: typeof Settings
  href: string
  color: string
}

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  const settingsModules: SettingsModule[] = [
    {
      title: t('modules.menu.title'),
      description: t('modules.menu.description'),
      icon: Menu,
      href: '/settings/menu',
      color: 'bg-purple-600',
    },
    {
      title: t('modules.security.title'),
      description: t('modules.security.description'),
      icon: Shield,
      href: '/settings/security',
      color: 'bg-emerald-600',
    },
    {
      title: t('modules.notifications.title'),
      description: t('modules.notifications.description'),
      icon: Bell,
      href: '/settings/notifications',
      color: 'bg-amber-500',
    },
    {
      title: t('modules.appearance.title'),
      description: t('modules.appearance.description'),
      icon: Palette,
      href: '/settings/appearance',
      color: 'bg-indigo-600',
    },
  ]

  return (
    <PageContainer maxWidth="xl">
      {/* En-tête de page */}
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Settings}
        iconBackground="bg-gradient-to-br from-blue-600 to-purple-600"
        badge={
          user && (
            <Badge variant="secondary" className="font-normal">
              <User className="h-3 w-3 mr-1" />
              {user.prenom} {user.nom}
            </Badge>
          )
        }
      />

      {/* Modules de paramètres */}
      <PageSection title="Modules" description="Configurez les différents aspects de l'application">
        <PageGrid cols={2}>
          {settingsModules?.map((module) => (
            <Card
              key={module.href}
              className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              onClick={() => router?.push(module.href)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${module.color}`}
                  >
                    <module.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </PageGrid>
      </PageSection>

      {/* Informations du compte */}
      {user && (
        <PageSection title="Informations du compte" icon={User} variant="card">
          <PageGrid cols={2}>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('fullName')}</p>
              <p className="text-foreground font-medium">
                {user.prenom} {user.nom}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('email')}</p>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('role')}</p>
              <p className="text-foreground font-medium">{user.role}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{t('status')}</p>
              <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                {t('active')}
              </Badge>
            </div>
          </PageGrid>
        </PageSection>
      )}
    </PageContainer>
  )
}
