'use client'

import type { Notification } from '@erp/domains/notifications'
import { Badge, Button, Input, ScrollArea } from '@erp/ui'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Maximize2,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNotifications } from '@/components/providers/notifications-provider'
import { useTranslation } from '@/lib/i18n/hooks'
import { cn } from '@/lib/utils'
import { NotificationDashboardV2 } from './notification-dashboard-v2'

export function NotificationCenter() {
  const { t } = useTranslation('common')
  const { t: tn } = useTranslation('notifications')
  const { state, actions } = useNotifications()
  const [showSettings, setShowSettings] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'error') return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (category === 'stock') return <Clock className="h-4 w-4 text-orange-500" />

    return <Bell className="h-4 w-4 text-blue-500" />
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return tn('time.now')
    if (minutes < 60) return tn('time.minutesAgo', { count: minutes })
    if (hours < 24) return tn('time.hoursAgo', { count: hours })

    return tn('time.daysAgo', { count: days })
  }

  // Filtrage simple par terme de recherche
  const filteredNotifications = useMemo(() => {
    if (searchTerm === '') {
      return state.notifications
    }

    return state.notifications.filter((notification) => {
      return (
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [state.notifications, searchTerm])

  return (
    <>
      <div className="relative">
        <Button variant="ghost" size="sm" className="relative" onClick={() => setIsOpen(!isOpen)}>
          <Bell className="h-4 w-4" />
          {state.unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-xs flex items-center justify-center"
            >
              {state.unreadCount > 99 ? '99+' : state.unreadCount}
            </Badge>
          )}
        </Button>

        {/* Panel de notifications avec positionnement absolu */}
        {isOpen && (
          <>
            {/* Overlay pour fermer en cliquant à l'extérieur */}
            <button
              type="button"
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
              aria-label="Close notification panel"
            />

            {/* Panel principal */}
            <div
              className={cn(
                'absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-lg z-50',
                'transform transition-all duration-200 ease-out'
              )}
            >
              {/* En-tête avec titre et actions */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t('notifications')}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-blue-600 hover:bg-blue-50"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        setShowDashboard(true)
                        setIsOpen(false)
                      }}
                      title={tn('actions.openDashboard')}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    {state.unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          actions.markAllAsRead()
                        }}
                        title={tn('actions.markAsRead')}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        setShowSettings(true)
                        setIsOpen(false) // Fermer le dropdown
                      }}
                      title={t('settings')}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        setIsOpen(false)
                      }}
                      title={t('close')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Statut de connexion */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      state.connected ? 'bg-green-500' : 'bg-orange-500'
                    )}
                  />
                  {state.connected ? tn('states.realTime') : tn('states.disconnected')}
                  <span className="ml-2">
                    {filteredNotifications.length} / {state.notifications.length}
                  </span>
                </div>
              </div>

              {/* Barre de recherche simple */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={tn('states.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-9 h-8"
                  />
                </div>
              </div>

              {/* Liste des notifications */}
              <ScrollArea className="max-h-64">
                {filteredNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchTerm ? tn('states.noResults') : tn('states.empty')}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredNotifications.map((notification: Notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={cn(
                          'group flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors w-full text-left',
                          !notification.isRead && 'bg-blue-50 border-l-2 border-l-blue-500'
                        )}
                        onClick={() => {
                          actions.markAsRead(notification.id)
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(
                            notification.type,
                            notification.metadata?.category || ''
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium leading-tight">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTimeAgo(new Date(notification.createdAt || Date.now()))}
                            </span>
                          </div>

                          {notification.message && (
                            <p className="text-sm text-gray-600 mt-1 leading-tight truncate">
                              {notification.message.length > 100
                                ? `${notification.message.substring(0, 100)}...`
                                : notification.message}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {notification.metadata?.category || notification.type}
                              </Badge>

                              {notification.priority && notification.priority !== 'NORMAL' && (
                                <Badge
                                  variant={
                                    notification.priority === 'URGENT' ? 'destructive' : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {notification.priority.toLowerCase()}
                                </Badge>
                              )}
                            </div>

                            {notification.actions && notification.actions.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation()
                                  if (notification.actions?.[0]?.url) {
                                    window.open(notification.actions[0].url, '_blank')
                                  }
                                }}
                              >
                                {notification.actions[0].label}
                              </Button>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            actions.deleteNotification(notification.id)
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                          title={tn('actions.delete')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Actions du bas */}
              {state.notifications.length > 0 && (
                <div className="p-2 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-gray-500 hover:text-red-600"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        actions.deleteAll()
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('clearAll')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        actions.refreshNotifications()
                      }}
                      className="flex-1"
                    >
                      {tn('actions.refresh')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Dialog pour les paramètres */}
      {showSettings &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            style={{ zIndex: 999999 }}
            aria-hidden="false"
          >
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{t('notificationSettings')}</h2>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Paramètres généraux */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">{t('generalSettings')}</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <span className="font-medium">{t('soundNotifications')}</span>
                        <p className="text-sm text-gray-600">
                          {tn('descriptions.soundNotifications')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={state.settings.enableSound}
                        onChange={(e) => actions.updateSettings({ enableSound: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <span className="font-medium">{tn('descriptions.toastNotifications')}</span>
                        <p className="text-sm text-gray-600">
                          {tn('descriptions.toastNotifications')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={state.settings.enableToast}
                        onChange={(e) => actions.updateSettings({ enableToast: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <span className="font-medium">
                          {tn('descriptions.browserNotifications')}
                        </span>
                        <p className="text-sm text-gray-600">
                          {tn('descriptions.browserNotifications')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={state.settings.enableBrowser}
                        onChange={(e) =>
                          actions.updateSettings({ enableBrowser: e.target.checked })
                        }
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <div>
                        <span className="font-medium">{tn('descriptions.emailNotifications')}</span>
                        <p className="text-sm text-gray-600">
                          {tn('descriptions.emailNotifications')}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={state.settings.enableEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          actions.updateSettings({ enableEmail: e.target.checked })
                        }
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Catégories */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">{tn('sections.categories')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries({
                      system: `🖥️ ${tn('categories.system')}`,
                      stock: `📦 ${tn('categories.stock')}`,
                      projet: `📁 ${tn('categories.projet')}`,
                      production: `🏭 Production`,
                      maintenance: `🔧 ${tn('categories.maintenance')}`,
                      qualite: `✅ Qualité`,
                      facturation: `💰 ${tn('categories.facture')}`,
                      sauvegarde: `💾 Sauvegarde`,
                      utilisateur: `👥 ${tn('categories.client')}`,
                    }).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            state.settings.categories[key as keyof typeof state.settings.categories]
                          }
                          onChange={(e) =>
                            actions.updateSettings({
                              categories: {
                                ...state.settings.categories,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-3"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priorités */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">{tn('sections.priority')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries({
                      low: '🟢 Faible',
                      normal: '🔵 Normal',
                      high: '🟠 Élevée',
                      urgent: '🔴 Urgente',
                    }).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            state.settings.priority[key as keyof typeof state.settings.priority]
                          }
                          onChange={(e) =>
                            actions.updateSettings({
                              priority: {
                                ...state.settings.priority,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mr-3"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if ('Notification' in window && Notification.permission === 'default') {
                      Notification.requestPermission()
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {tn('actions.requestPermission')}
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Les paramètres sont sauvegardés automatiquement via updateSettings
                      setShowSettings(false)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Dashboard plein écran */}
      <NotificationDashboardV2 isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
    </>
  )
}
