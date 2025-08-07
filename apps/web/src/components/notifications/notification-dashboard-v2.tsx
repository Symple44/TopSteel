'use client'

import type { Notification } from '@erp/domains/notifications'
import { Badge, Button, Input, ScrollArea, Separator } from '@erp/ui'
import {
  Archive,
  Bell,
  CheckCheck,
  ChevronRight,
  Database,
  Eye,
  Factory,
  FileText,
  HardDrive,
  Package,
  Search,
  Send,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNotifications } from '@/components/providers/notifications-provider'
import { cn } from '@/lib/utils'

interface NotificationDashboardV2Props {
  isOpen: boolean
  onClose: () => void
}

const categoryConfig = {
  all: { label: 'Toutes', icon: Bell, color: 'text-gray-600' },
  system: { label: 'Système', icon: Database, color: 'text-blue-600' },
  stock: { label: 'Stock', icon: Package, color: 'text-green-600' },
  projet: { label: 'Projets', icon: FileText, color: 'text-purple-600' },
  production: { label: 'Production', icon: Factory, color: 'text-orange-600' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'text-red-600' },
  qualite: { label: 'Qualité', icon: Shield, color: 'text-cyan-600' },
  facturation: { label: 'Facturation', icon: FileText, color: 'text-yellow-600' },
  sauvegarde: { label: 'Sauvegarde', icon: HardDrive, color: 'text-gray-600' },
  utilisateur: { label: 'Utilisateurs', icon: Users, color: 'text-indigo-600' },
} as const

const priorityConfig = {
  all: { label: 'Toutes priorités', color: 'bg-gray-100 text-gray-700' },
  low: { label: 'Faible', color: 'bg-green-100 text-green-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Élevée', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
} as const

export function NotificationDashboardV2({ isOpen, onClose }: NotificationDashboardV2Props) {
  const { state, actions } = useNotifications()
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'read' | 'unread' | 'archived'>(
    'all'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferUserId, setTransferUserId] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

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

    // Filtre par statut
    if (selectedStatus === 'read') {
      filtered = filtered.filter((n) => n.readAt)
    } else if (selectedStatus === 'unread') {
      filtered = filtered.filter((n) => !n.readAt)
    } else if (selectedStatus === 'archived') {
      // Pour l'instant, aucune notification archivée car la propriété n'existe pas
      filtered = []
    }
    // 'all' - affiche toutes les notifications

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  }, [state.notifications, selectedCategory, selectedPriority, selectedStatus, searchTerm])

  // Compter par catégorie
  const categoryCounts = useMemo(() => {
    const activeNotifications = state.notifications
    const counts: Record<string, number> = { all: activeNotifications.length }
    activeNotifications.forEach((n) => {
      const cat = n.metadata?.category || 'system'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [state.notifications])

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return `Il y a ${days} jours`
    } else {
      return d.toLocaleDateString('fr-FR')
    }
  }

  const handleTransfer = () => {
    if (selectedNotification && transferUserId) {
      // TODO: Implémenter l'API de transfert
      setShowTransferModal(false)
      setTransferUserId('')
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 999999 }}
      aria-hidden="false"
    >
      <div className="flex items-center justify-center h-full p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] overflow-hidden flex">
          {/* Sidebar des filtres */}
          <div className="w-72 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <Badge variant="secondary">{filteredNotifications.length}</Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Recherche */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Statut */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Statut</h3>
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'Toutes', count: state.notifications.length },
                    { value: 'unread', label: 'Non lues', count: state.unreadCount },
                    {
                      value: 'read',
                      label: 'Lues',
                      count: state.notifications.filter((n) => n.readAt).length,
                    },
                    { value: 'archived', label: 'Archivées', count: 0 },
                  ].map((status) => (
                    <button
                      type="button"
                      key={status.value}
                      onClick={() => setSelectedStatus(status.value as any)}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors',
                        selectedStatus === status.value
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      )}
                    >
                      <span>{status.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {status.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Catégories */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Catégories</h3>
                <div className="space-y-1">
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const Icon = config.icon
                    const count = categoryCounts[key] || 0

                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={cn(
                          'w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors',
                          selectedCategory === key
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'hover:bg-gray-100'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', config.color)} />
                        <span className="flex-1 text-left">{config.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Priorité */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Priorité</h3>
                <div className="space-y-1">
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSelectedPriority(key)}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors',
                        selectedPriority === key
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-100'
                      )}
                    >
                      <span
                        className={cn(
                          key !== 'all' && config.color.includes('bg-')
                            ? `px-2 py-1 rounded-full ${config.color}`
                            : ''
                        )}
                      >
                        {config.label}
                      </span>
                      {selectedPriority === key && (
                        <div className="h-2 w-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => actions.deleteAll()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Tout effacer
              </Button>
            </div>
          </div>

          {/* Zone principale */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {selectedCategory === 'all'
                    ? 'Toutes les notifications'
                    : categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {filteredNotifications.length} notification
                  {filteredNotifications.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {state.unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={() => actions.markAllAsRead()}>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Liste des notifications */}
            <ScrollArea className="flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                  <Bell className="h-12 w-12 mb-4 text-gray-300" />
                  <p>Aucune notification trouvée</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const category = notification.metadata?.category || 'system'
                    const CategoryIcon =
                      categoryConfig[category as keyof typeof categoryConfig]?.icon || Bell
                    const categoryColor =
                      categoryConfig[category as keyof typeof categoryConfig]?.color ||
                      'text-gray-600'

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        className={cn(
                          'p-4 hover:bg-gray-50 transition-colors cursor-pointer w-full text-left',
                          !notification.readAt && 'bg-blue-50/50'
                        )}
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <div className="flex gap-3">
                          <div className={cn('mt-1', categoryColor)}>
                            <CategoryIcon className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4
                                  className={cn(
                                    'font-medium',
                                    !notification.readAt && 'text-blue-900'
                                  )}
                                >
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(notification.createdAt || new Date())}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {categoryConfig[category as keyof typeof categoryConfig]?.label ||
                                  'Système'}
                              </Badge>

                              {notification.priority && notification.priority !== 'NORMAL' && (
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    priorityConfig[
                                      notification.priority.toLowerCase() as keyof typeof priorityConfig
                                    ]?.color
                                  )}
                                >
                                  {
                                    priorityConfig[
                                      notification.priority.toLowerCase() as keyof typeof priorityConfig
                                    ]?.label
                                  }
                                </Badge>
                              )}

                              {!notification.readAt && (
                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                              )}

                              {false && <span className="text-xs text-gray-500">📁</span>}
                            </div>
                          </div>

                          <ChevronRight className="h-4 w-4 text-gray-400 mt-2" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Panneau de détail */}
          {selectedNotification && (
            <div className="w-96 border-l bg-gray-50 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Détails</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNotification(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-lg">{selectedNotification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedNotification.message}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Date</span>
                      <span>
                        {new Date(selectedNotification.createdAt || Date.now()).toLocaleString(
                          'fr-FR'
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Catégorie</span>
                      <Badge variant="outline">
                        {
                          categoryConfig[
                            (selectedNotification.metadata?.category ||
                              'system') as keyof typeof categoryConfig
                          ]?.label
                        }
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Priorité</span>
                      <Badge
                        className={cn(
                          priorityConfig[
                            (selectedNotification.priority?.toLowerCase() ||
                              'normal') as keyof typeof priorityConfig
                          ]?.color
                        )}
                      >
                        {
                          priorityConfig[
                            (selectedNotification.priority?.toLowerCase() ||
                              'normal') as keyof typeof priorityConfig
                          ]?.label
                        }
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Statut</span>
                      <div className="flex items-center gap-2">
                        <span>{selectedNotification.readAt ? '✅ Lue' : '🔵 Non lue'}</span>
                        {false && <span className="text-gray-500">📁 Archivée</span>}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Actions</h5>

                    {!selectedNotification.readAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => actions.markAsRead(selectedNotification.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Marquer comme lue
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowTransferModal(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Transférer à un utilisateur
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        actions.deleteNotification(selectedNotification.id)
                        setSelectedNotification(null)
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archiver
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        actions.deleteNotification(selectedNotification.id)
                        setSelectedNotification(null)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Modal de transfert */}
      {showTransferModal &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
            style={{ zIndex: 999999 }}
            aria-hidden="false"
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Transférer la notification</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez l'utilisateur à qui transférer cette notification.
              </p>
              <Input
                placeholder="ID ou email de l'utilisateur"
                value={transferUserId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTransferUserId(e.target.value)
                }
                className="mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransferModal(false)
                    setTransferUserId('')
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleTransfer}>
                  <Send className="h-4 w-4 mr-2" />
                  Transférer
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>,
    document.body
  )
}
