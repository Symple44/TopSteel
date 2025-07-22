/**
 * Page d'accueil - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/page.tsx
 */

'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/hooks'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { CompanyLogo } from '@/components/ui/company-logo'
import { useCompanyInfo } from '@/hooks/use-company-info'
import {
  ArrowRight,
  BarChart3,
  Building2,
  Factory,
  FolderOpen,
  Package,
  Settings,
  Shield,
  Users,
} from 'lucide-react'

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { companyInfo } = useCompanyInfo()
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const router = useRouter()
  
  // Vérifier l'authentification - mais ne pas rediriger vers dashboard
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/')
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
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: t('actions.newProject.title'),
      description: t('actions.newProject.description'),
      icon: FolderOpen,
      href: '/projects/new',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: t('actions.production.title'),
      description: t('actions.production.description'),
      icon: Factory,
      href: '/production',
      color: 'from-orange-500 to-red-600'
    },
    {
      title: t('actions.inventory.title'),
      description: t('actions.inventory.description'),
      icon: Package,
      href: '/inventory',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: t('actions.users.title'),
      description: t('actions.users.description'),
      icon: Users,
      href: '/admin/users',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      title: t('actions.configuration.title'),
      description: t('actions.configuration.description'),
      icon: Settings,
      href: '/admin',
      color: 'from-slate-500 to-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <CompanyLogo size="xl" showName={false} className="drop-shadow-xl" />
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
            {t('welcome', { companyName: companyInfo?.name || 'TopSteel' })}
          </h1>
          
          <p className="text-xl text-slate-600 mb-2">
            {t('subtitle')}
          </p>
          
          <p className="text-slate-500 mb-8">
            {t('description')}
          </p>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-8"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              {t('accessDashboard')}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/admin/company')}
              className="border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white px-8"
            >
              <Building2 className="mr-2 h-5 w-5" />
              {t('configureCompany')}
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
            {t('quickActionsTitle')}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="group cursor-pointer border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden relative"
                onClick={() => router.push(action.href)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color}/10 opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <CardHeader className="pb-3 relative z-10">
                  <CardTitle className="text-lg flex items-center text-slate-800 group-hover:text-slate-900 transition-colors">
                    <div className={`p-3 bg-gradient-to-r ${action.color} rounded-lg mr-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    {action.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <p className="text-slate-600 group-hover:text-slate-700 mb-4">
                    {action.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    {t('actions.access')}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
