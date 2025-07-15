'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import { Save, RefreshCw } from 'lucide-react'
import { CompanySettings } from '@/components/admin/company-settings'
import { UnitsAndListsSettings } from '@/components/admin/units-lists-settings'
import { AuthenticationSettings } from '@/components/admin/authentication-settings'
import { useSystemParameters } from '@/hooks/use-system-parameters'
import { toast } from '@/hooks/use-toast'

export default function AdminConfigurationPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [activeTab, setActiveTab] = useState('company')
  const { saveParameters, isLoading } = useSystemParameters()

  const handleSave = async () => {
    try {
      await saveParameters()
      toast({
        title: t('admin:saveSuccess'),
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: t('admin:saveError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleReset = () => {
    if (window.confirm(t('admin:resetConfirm'))) {
      // TODO: Implement reset to defaults
      console.log('Reset to defaults')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('admin:title')}</h1>
        <p className="text-muted-foreground mt-2">
          Configurez les paramètres globaux de votre ERP
        </p>
      </div>

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="company">{t('admin:tabs.company')}</TabsTrigger>
            <TabsTrigger value="units">{t('admin:tabs.units')}</TabsTrigger>
            <TabsTrigger value="authentication">{t('admin:tabs.authentication')}</TabsTrigger>
            <TabsTrigger value="workflow">{t('admin:tabs.workflow')}</TabsTrigger>
            <TabsTrigger value="integrations">{t('admin:tabs.integrations')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('admin:tabs.advanced')}</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <CompanySettings />
          </TabsContent>

          <TabsContent value="units">
            <UnitsAndListsSettings />
          </TabsContent>

          <TabsContent value="authentication">
            <AuthenticationSettings />
          </TabsContent>

          <TabsContent value="workflow">
            <div className="text-center py-8 text-muted-foreground">
              Configuration des flux de travail - À venir
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="text-center py-8 text-muted-foreground">
              Configuration des intégrations - À venir
            </div>
          </TabsContent>

          <TabsContent value="advanced">
            <div className="text-center py-8 text-muted-foreground">
              Paramètres avancés - À venir
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin:resetToDefaults')}
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {t('common:save')}
          </Button>
        </div>
      </Card>
    </div>
  )
}