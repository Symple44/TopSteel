'use client'

import type { Notification } from '@erp/domains/notifications'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
  Separator,
} from '@erp/ui'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Clock,
  Database,
  Factory,
  FileText,
  HardDrive,
  Package,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNotifications } from '@/components/providers/notifications-provider'
import { cn } from '@/lib/utils'

const categoryIcons = {
  system: Database,
  stock: Package,
  projet: FileText,
  production: Factory,
  maintenance: Wrench,
  qualite: Shield,
  facturation: FileText,
  sauvegarde: HardDrive,
  utilisateur: Users,
} as const

const categoryLabels = {
  system: 'Système',
  stock: 'Stock',
  projet: 'Projets',
  production: 'Production',
  maintenance: 'Maintenance',
  qualite: 'Qualité',
  facturation: 'Facturation',
  sauvegarde: 'Sauvegarde',
  utilisateur: 'Utilisateurs',
} as const

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
} as const

interface NotificationDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDashboard({ isOpen, onClose }: NotificationDashboardProps) {
  const { state, actions } = useNotifications()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [_showSettings, setShowSettings] = useState(false)

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

  // Grouper les notifications par catégorie
  const notificationsByCategory = useMemo(() => {
    const grouped = state.notifications.reduce(
      (acc, notification) => {
        const category = notification.metadata?.category || 'system'
        if (!acc[category]) acc[category] = []
        acc[category].push(notification)
        return acc
      },
      {} as Record<string, Notification[]>
    )

    return grouped
  }, [state.notifications])

  // Filtrer les notifications
  const filteredNotifications = useMemo(() => {
    let filtered = state.notifications

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((n) => (n.metadata?.category || 'system') === selectedCategory)
    }

    // Filtre par priorité
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(
        (n) => (n.priority?.toLowerCase() || 'normal') === selectedPriority
      )
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [state.notifications, selectedCategory, selectedPriority, searchTerm])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Dashboard des notifications</DialogTitle>
          <DialogDescription>
            Interface complète de gestion des notifications avec filtres et catégories
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    state.connected ? 'bg-green-500' : 'bg-orange-500'
                  )}
                />
                {state.connected ? 'Temps réel' : 'Déconnecté'}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {/* Toutes les notifications */}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-white transition-colors',
                    selectedCategory === 'all' && 'bg-white shadow-sm border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">Toutes</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {state.notifications.length}
                  </Badge>
                </button>

                <Separator />

                {/* Catégories */}
                {Object.entries(categoryLabels).map(([key, label]) => {
                  const Icon = categoryIcons[key as keyof typeof categoryIcons]
                  const count = notificationsByCategory[key]?.length || 0
                  const unreadCount =
                    notificationsByCategory[key]?.filter((n) => !n.isRead).length || 0

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-white transition-colors',
                        selectedCategory === key && 'bg-white shadow-sm border'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold">
                    {selectedCategory === 'all'
                      ? 'Toutes les notifications'
                      : categoryLabels[selectedCategory as keyof typeof categoryLabels]}
                  </h3>
                  <Badge variant="outline">
                    {filteredNotifications.length} notification
                    {filteredNotifications.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {state.unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => actions.markAllAsRead()}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Marquer tout comme lu
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filtres */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher dans les notifications..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-9"
                  />
                </div>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="low">Faible</option>
                  <option value="normal">Normal</option>
                  <option value="high">Élevée</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            {/* Liste des notifications */}
            <ScrollArea className="flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-4 text-gray-300" />
                  <p>Aucune notification trouvée</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'group p-4 rounded-lg border hover:shadow-sm transition-all cursor-pointer',
                        !notification.isRead && 'bg-blue-50 border-blue-200'
                      )}
                      onClick={() => actions.markAsRead(notification.id)}
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(
                            notification.type,
                            notification.metadata?.category || ''
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium leading-tight">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {formatTimeAgo(new Date(notification.createdAt || Date.now()))}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation()
                                  actions.deleteNotification(notification.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[
                                notification.metadata?.category as keyof typeof categoryLabels
                              ] || 'Système'}
                            </Badge>

                            {notification.priority && notification.priority !== 'NORMAL' && (
                              <Badge
                                className={cn(
                                  'text-xs',
                                  priorityColors[
                                    notification.priority.toLowerCase() as keyof typeof priorityColors
                                  ]
                                )}
                              >
                                {notification.priority.toLowerCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Actions du bas */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.deleteAll()}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Effacer tout
                </Button>
                <Button variant="ghost" size="sm" onClick={() => actions.refreshNotifications()}>
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
