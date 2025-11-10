/**
 * Page de gestion des notifications utilisateur - TopSteel ERP
 * Fichier: apps/web/src/app/(dashboard)/settings/notifications/page.tsx
 */

'use client'

export const dynamic = 'force-dynamic'

import { Button, Card, CardContent, CardHeader, CardTitle, useUniqueId } from '@erp/ui'
import { ArrowLeft, Bell, Check, Clock, Mail, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNotificationSettings } from '@/hooks/use-notification-settings'
import { useTranslation } from '@/lib/i18n/hooks'

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50/30 to-red-50/30">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router?.back()}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('notifications.back')}
          </Button>

          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl shadow-lg mr-4">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('notifications.title')}</h1>
              <p className="text-slate-600">{t('notifications.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Notifications par email */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Mail className="h-6 w-6 mr-3 text-blue-600" />
                {t('settingsEnhanced.notifications.sections.email')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                newMessages: t('settingsEnhanced.notifications.emailTypes.newMessages'),
                systemAlerts: t('settingsEnhanced.notifications.emailTypes.systemAlerts'),
                taskReminders: t('settingsEnhanced.notifications.emailTypes.taskReminders'),
                weeklyReports: 'Rapports hebdomadaires',
                securityAlerts: 'Alertes de sécurité',
                maintenanceNotice: t(
                  'settingsEnhanced.notifications.emailTypes.maintenanceNotifications'
                ),
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-slate-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailTypes[key as keyof typeof settings.emailTypes]}
                      onChange={(e) => updateNestedSetting('emailTypes', key, e?.target?.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notifications push */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Smartphone className="h-6 w-6 mr-3 text-green-600" />
                {t('settingsEnhanced.notifications.sections.push')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700">
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
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {settings?.pushTypes?.enabled && (
                <>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-700">
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
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-700">
                      {t('settingsEnhanced.notifications.sections.categories')} :
                    </h4>
                    {Object.entries({
                      urgent: 'Notifications urgentes',
                      normal: 'Notifications normales',
                      quiet: 'Notifications discrètes',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between py-1 pl-4">
                        <span className="text-slate-600 text-sm">{label}</span>
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
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Heures de silence */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-800">
                <Clock className="h-6 w-6 mr-3 text-purple-600" />
                {t('settingsEnhanced.notifications.sections.silent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-700">Activer le mode silencieux</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.quietHours?.enabled}
                    onChange={(e) =>
                      updateNestedSetting('quietHours', 'enabled', e?.target?.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {settings?.quietHours?.enabled && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div>
                    <label
                      htmlFor={quietHoursStartId}
                      className="block text-sm text-slate-600 mb-1"
                    >
                      {tc('common.start')}
                    </label>
                    <input
                      id={quietHoursStartId}
                      type="time"
                      value={settings?.quietHours?.start}
                      onChange={(e) => updateNestedSetting('quietHours', 'start', e?.target?.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={quietHoursEndId} className="block text-sm text-slate-600 mb-1">
                      {tc('common.end')}
                    </label>
                    <input
                      id={quietHoursEndId}
                      type="time"
                      value={settings?.quietHours?.end}
                      onChange={(e) => updateNestedSetting('quietHours', 'end', e?.target?.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-between pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="px-6 text-red-600 border-red-200 hover:bg-red-50"
            >
              {t('notifications.reset')}
            </Button>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router?.back()}
                className="px-8"
              >
                {t('notifications.back')}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`px-8 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 ${
                  hasUnsavedChanges ? '' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Check className="h-4 w-4 mr-2" />
                {hasUnsavedChanges ? t('notifications.save') : t('notifications.saved')}
              </Button>
            </div>
          </div>

          {/* Indicateur de changements non sauvegardés */}
          {hasUnsavedChanges && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">⚠️ {t('notifications.unsavedChanges')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
