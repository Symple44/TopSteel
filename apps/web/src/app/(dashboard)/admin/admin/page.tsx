'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useAppearanceSettings } from '@/hooks/use-appearance-settings'
import { Button, Card } from '@erp/ui'
import { Building2, ListChecks, Shield, Workflow, Plug, Settings, Search } from 'lucide-react'
import { CompanySettings } from '@/components/admin/company-settings'
import { UnitsAndListsSettings } from '@/components/admin/units-lists-settings'
import { AuthenticationSettings } from '@/components/admin/authentication-settings'
import { ElasticsearchAdmin } from '@/components/admin/elasticsearch-admin'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

const getNavigationItems = (t: any) => [
  {
    id: 'company',
    label: t('tabs.company'),
    icon: Building2,
    description: t('company.title')
  },
  {
    id: 'units',
    label: t('tabs.units'),
    icon: ListChecks,
    description: t('units.title')
  },
  {
    id: 'authentication',
    label: t('tabs.authentication'),
    icon: Shield,
    description: t('authentication.title')
  },
  {
    id: 'elasticsearch',
    label: 'Elasticsearch',
    icon: Search,
    description: t('elasticsearch.title')
  },
  {
    id: 'workflow',
    label: t('tabs.workflow'),
    icon: Workflow,
    description: t('workflow.title')
  },
  {
    id: 'integrations',
    label: t('tabs.integrations'),
    icon: Plug,
    description: t('integrations.title')
  },
  {
    id: 'advanced',
    label: t('tabs.advanced'),
    icon: Settings,
    description: t('advanced.title')
  }
]

export default function AdminConfigurationPage() {
  const { t } = useTranslation('admin')
  const { settings } = useAppearanceSettings()
  const [activeSection, setActiveSection] = useState('company')
  const navigationItems = getNavigationItems(t)

  const renderContent = () => {
    switch (activeSection) {
      case 'company':
        return <CompanySettings />
      case 'units':
        return <UnitsAndListsSettings />
      case 'authentication':
        return <AuthenticationSettings />
      case 'elasticsearch':
        return <ElasticsearchAdmin />
      case 'workflow':
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Workflow className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('workflow.title')}</h3>
            <p>{t('workflow.comingSoon')}</p>
          </div>
        )
      case 'integrations':
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Plug className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('integrations.title')}</h3>
            <p>{t('integrations.comingSoon')}</p>
          </div>
        )
      case 'advanced':
        return (
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('advanced.title')}</h3>
            <p>{t('advanced.comingSoon')}</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-96 flex-shrink-0">
          <Card className="p-4">
            <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
              Configuration
            </h2>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className={`text-xs mt-1 ${
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="p-6">
            <div className="min-h-[600px]">
              {renderContent()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}