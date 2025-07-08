'use client'

import { useNotifications } from '@/components/providers/notifications-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Notification } from '@erp/types'
import { AlertTriangle, Bell, CheckCheck, Clock, Settings, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { NotificationSettings } from './notification-settings'

export function NotificationCenter() {
  const { state, actions } = useNotifications()
  const [showSettings, setShowSettings] = useState(false)

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

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`

    return `Il y a ${days}j`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
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
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-1">
              {state.unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actions.markAllAsRead}
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" title="Paramètres">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Paramètres de Notifications</DialogTitle>
                  </DialogHeader>
                  <NotificationSettings />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                state.connected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            {state.connected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-96">
          {state.notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Aucune notification</div>
          ) : (
            <div className="p-2 space-y-1">
              {state.notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors',
                    !notification.read && 'bg-blue-50 border-l-2 border-l-blue-500'
                  )}
                  onClick={() => actions.markAsRead(notification.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type, notification.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-tight">{notification.title}</h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTimeAgo(new Date(notification.createdAt || Date.now()))}
                      </span>
                    </div>

                    {notification.message && (
                      <p className="text-sm text-gray-600 mt-1 leading-tight">
                        {notification.message}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>

                        {notification.metadata?.priority &&
                          notification.metadata.priority !== 'normal' && (
                            <Badge
                              variant={
                                notification.metadata.priority === 'urgent'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {notification.metadata.priority}
                            </Badge>
                          )}
                      </div>

                      {notification.actionUrl && notification.actionLabel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(notification.actionUrl, '_blank')
                          }}
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.removeNotification(notification.id)
                    }}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                    title="Supprimer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {state.notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-500 hover:text-red-600"
                onClick={actions.clearAll}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Effacer tout
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
