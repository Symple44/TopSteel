/**
 * Page de gestion des notifications utilisateur - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/settings/notifications/page.tsx
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
  PageHeader,
  PageSection,
  useUniqueId,
} from '@erp/ui'
import { Bell, Check, Clock, Mail, RotateCcw, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '../../../../hooks/use-auth'
import { useNotificationSettings } from '../../../../hooks/use-notification-settings'
import { useTranslation } from '../../../../lib/i18n/hooks'

export default function NotificationsSettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('settings')
  const { t: tc } = useTranslation('common')

  // Hook pour gérer les paramètres de notification
  const {
    settings,
    updateNestedSetting,
    saveSettings,
    resetSettings,
    isLoading: settingsLoading,
    hasUnsavedChanges,
  } = useNotificationSettings()

  // Generate unique IDs for form fields
  const quietHoursStartId = useUniqueId('quiet-hours-start')
  const quietHoursEndId = useUniqueId('quiet-hours-end')

  // Vérifier l'authentification
  React?.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router?.push('/login?redirect=/settings/notifications')
    }
  }, [isAuthenticated, authLoading, router])

  // Afficher un loader si pas encore authentifié ou si les paramètres chargent
  if (authLoading || !isAuthenticated || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('notifications.loading')}</p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      await saveSettings()
      alert(t('notifications.saveSuccess'))
    } catch (_error) {
      alert(t('notifications.saveError'))
    }
  }

  const handleReset = () => {
    if (confirm(t('notifications.resetConfirm'))) {
      resetSettings()
    }
  }

  return (
    <PageContainer maxWidth="full" padding="default">
      <PageHeader
        title={t('notifications.title')}
        description={t('notifications.subtitle')}
        icon={Bell}
        iconBackground="bg-gradient-to-br from-amber-500 to-orange-600"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-destructive"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('notifications.reset')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
            >
              <Check className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? t('notifications.save') : t('notifications.saved')}
            </Button>
          </div>
        }
      />

      <PageSection spacing="default">
        <div className="space-y-6">
          {/* Indicateur de changements non sauvegardés */}
          {hasUnsavedChanges && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">⚠️ {t('notifications.unsavedChanges')}</p>
            </div>
          )}

          {/* Notifications par email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Mail className="h-6 w-6 mr-3 text-blue-600" />
                {t('settingsEnhanced.notifications.sections.email')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                newMessages: t('settingsEnhanced.notifications.emailTypes.newMessages'),
                systemAlerts: t('settingsEnhanced.notifications.emailTypes.systemAlerts'),
                taskReminders: t('settingsEnhanced.notifications.emailTypes.taskReminders'),
                weeklyReports: t('settingsEnhanced.notifications.emailTypes.weeklyReports'),
                securityAlerts: t('settingsEnhanced.notifications.emailTypes.securityAlerts'),
                maintenanceNotice: t(
                  'settingsEnhanced.notifications.emailTypes.maintenanceNotifications'
                ),
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-foreground">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailTypes[key as keyof typeof settings.emailTypes]}
                      onChange={(e) => updateNestedSetting('emailTypes', key, e?.target?.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notifications push */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Smartphone className="h-6 w-6 mr-3 text-green-600" />
                {t('settingsEnhanced.notifications.sections.push')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-foreground">
                  {t('settingsEnhanced.notifications.descriptions.pushNotifications')}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.pushTypes?.enabled}
                    onChange={(e) =>
                      updateNestedSetting('pushTypes', 'enabled', e?.target?.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {settings?.pushTypes?.enabled && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground">
                      {t('settingsEnhanced.notifications.descriptions.soundNotifications')}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings?.pushTypes?.sound}
                        onChange={(e) =>
                          updateNestedSetting('pushTypes', 'sound', e?.target?.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">
                      {t('settingsEnhanced.notifications.sections.categories')} :
                    </h4>
                    {Object.entries({
                      urgent: t('settingsEnhanced.notifications.categoryTypes.urgent'),
                      normal: t('settingsEnhanced.notifications.categoryTypes.normal'),
                      quiet: t('settingsEnhanced.notifications.categoryTypes.quiet'),
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between py-1 pl-4">
                        <span className="text-muted-foreground text-sm">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              settings.pushTypes[key as keyof typeof settings.pushTypes] as boolean
                            }
                            onChange={(e) =>
                              updateNestedSetting('pushTypes', key, e?.target?.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Heures de silence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Clock className="h-6 w-6 mr-3 text-purple-600" />
                {t('settingsEnhanced.notifications.sections.silent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-foreground">{t('settingsEnhanced.notifications.silentMode.enable')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.quietHours?.enabled}
                    onChange={(e) =>
                      updateNestedSetting('quietHours', 'enabled', e?.target?.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {settings?.quietHours?.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div>
                    <label
                      htmlFor={quietHoursStartId}
                      className="block text-sm text-muted-foreground mb-1"
                    >
                      {tc('common.start')}
                    </label>
                    <input
                      id={quietHoursStartId}
                      type="time"
                      value={settings?.quietHours?.start}
                      onChange={(e) => updateNestedSetting('quietHours', 'start', e?.target?.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={quietHoursEndId} className="block text-sm text-muted-foreground mb-1">
                      {tc('common.end')}
                    </label>
                    <input
                      id={quietHoursEndId}
                      type="time"
                      value={settings?.quietHours?.end}
                      onChange={(e) => updateNestedSetting('quietHours', 'end', e?.target?.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageSection>
    </PageContainer>
  )
}
