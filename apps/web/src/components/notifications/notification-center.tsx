'use client'

import { useNotifications } from '@/components/providers/notifications-provider'
import { cn } from '@/lib/utils'
import type { Notification } from '@erp/domains/notifications'

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  ScrollArea,
  Separator,
  Input,
} from '@erp/ui'

import { AlertTriangle, Bell, CheckCheck, Clock, Settings, Trash2, X, Search, Maximize2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { NotificationSettings } from './notification-settings'

export function NotificationCenter() {
  const { state, actions } = useNotifications()
  const [showSettings, setShowSettings] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

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

  // Filtrage simple par terme de recherche
  const filteredNotifications = useMemo(() => {
    if (searchTerm === '') {
      return state.notifications
    }
    
    return state.notifications.filter((notification) => {
      return notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [state.notifications, searchTerm])

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
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
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel principal */}
          <div className={cn(
            "absolute right-0 top-full mt-2 w-96 bg-white border rounded-lg shadow-lg z-50",
            "transform transition-all duration-200 ease-out",
            "animate-in slide-in-from-top-2 fade-in-0"
          )}>
            {/* En-tête avec titre et actions */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    title="Agrandir/Réduire"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  {state.unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={actions.markAllAsRead} title="Marquer tout comme lu">
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                    title="Fermer"
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
                {state.connected ? 'Temps réel' : 'Manuel'}
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
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8"
                />
              </div>
            </div>

            {/* Liste des notifications */}
            <ScrollArea className={cn(isExpanded ? "max-h-96" : "max-h-64")}>
              {filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'Aucune notification trouvée' : 'Aucune notification'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredNotifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'group flex gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors',
                        !notification.isRead && 'bg-blue-50 border-l-2 border-l-blue-500'
                      )}
                      onClick={() => actions.markAsRead(notification.id)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type, notification.metadata?.category || '')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium leading-tight">{notification.title}</h4>
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
                          actions.removeNotification(notification.id)
                        }}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                        title="Supprimer"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
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
                    onClick={actions.clearAll}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Effacer tout
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.refreshNotifications}
                    className="flex-1"
                  >
                    Actualiser
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
