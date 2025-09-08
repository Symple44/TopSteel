import type { NotificationFilters } from '@erp/domains'
import type { NotificationPriority, NotificationType } from '@erp/types'

// Define local types since they're not available from cross-cutting
interface CreateNotificationRequest {
  type: string
  category: string
  title: string
  message: string
  priority?: string
  source?: string
  entityType?: string
  entityId?: string
  data?: any
  recipientType?: string
  recipientId?: string
  actionUrl?: string
  actionLabel?: string
  actionType?: string
  expiresAt?: string
  persistent?: boolean
  autoRead?: boolean
}

import { type NextRequest, NextResponse } from 'next/server'

interface Notification {
  id: string
  type: string
  category: string
  title: string
  message: string
}

interface NotificationSetting {
  id: string
  userId: string
  category: string
  enabled: boolean
}

interface NotificationRead {
  id: string
  userId: string
  notificationId: string
  readAt: Date
}

// Mock de connexion à la base de données (à remplacer par la vraie connexion)
class MockDatabaseConnection {
  private notifications: Notification[] = []
  private settings: NotificationSetting[] = []
  private reads: NotificationRead[] = []

  async query<T = unknown>(sql: string, _params?: unknown[]): Promise<T[]> {
    // Simulation basique pour les tests
    if (sql?.includes('notification_settings')) {
      return this.settings as T[]
    }
    if (sql?.includes('notification_reads')) {
      return this.reads as T[]
    }
    if (sql?.includes('notifications')) {
      return this.notifications as T[]
    }
    return [] as T[]
  }

  async execute(
    sql: string,
    params?: unknown[]
  ): Promise<{ insertId?: number; affectedRows: number }> {
    // Simulation basique pour les tests
    if (sql?.includes('INSERT INTO notifications')) {
      const notification = {
        id: (params?.[0] as string) || this?.generateUUID(),
        type: (params?.[1] as string) || 'info',
        category: (params?.[2] as string) || 'system',
        title: (params?.[3] as string) || 'Test',
        message: (params?.[4] as string) || 'Test message',
        priority: (params?.[5] as string) || 'NORMAL',
        source: params?.[6] || null,
        entity_type: params?.[7] || null,
        entity_id: params?.[8] || null,
        data: params?.[9] || null,
        recipient_type: (params?.[10] as string) || 'all',
        recipient_id: params?.[11] || null,
        action_url: params?.[12] || null,
        action_label: params?.[13] || null,
        action_type: (params?.[14] as string) || 'primary',
        expires_at: params?.[15] || null,
        persistent: params?.[16] !== false,
        auto_read: params?.[17] || false,
        created_at: params?.[18] || new Date().toISOString(),
        is_read: false,
        read_at: null,
      }
      this?.notifications?.unshift(notification)
      return { affectedRows: 1 }
    }
    return { affectedRows: 0 }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v?.toString(16)
    })
  }

  constructor() {
    this.notifications = []
  }
}

// Mock NotificationDatabaseService since it's not exported
class NotificationDatabaseService {
  async getNotifications(_filters: NotificationFilters, _userId: string) {
    // Mock implementation - in real app this would query the database
    const mockNotifications = [
      {
        id: '1',
        type: 'info',
        category: 'system',
        title: 'Welcome',
        message: 'Welcome to the system',
        priority: 'NORMAL',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]
    return {
      notifications: mockNotifications,
      total: mockNotifications.length,
      unreadCount: mockNotifications?.filter((n) => !n.isRead).length,
    }
  }

  async createNotification(request: CreateNotificationRequest) {
    // Mock implementation
    const notification = {
      id: Math.random().toString(36).substr(2, 9),
      ...request,
      createdAt: new Date().toISOString(),
      isRead: false,
    }
    return notification
  }
}

// Créer une instance du service
const _mockDb = new MockDatabaseConnection()
const notificationService = new NotificationDatabaseService()

export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    // Récupérer l'userId depuis les headers ou cookies
    const authHeader = request?.headers?.get('authorization')
    const userId = authHeader
      ? authHeader?.replace('Bearer ', '')
      : searchParams?.get('userId') || 'default-user'

    const filters: NotificationFilters = {
      category: searchParams?.get('category') || undefined,
      type: (searchParams?.get('type')?.split(',') as NotificationType[]) || undefined,
      priority: (searchParams?.get('priority')?.split(',') as NotificationPriority[]) || undefined,
      isRead: searchParams?.get('unread') === 'true' ? false : undefined,
      entityType: searchParams?.get('entityType') || undefined,
      entityId: searchParams?.get('entityId') || undefined,
      createdAfter: searchParams?.get('fromDate')
        ? new Date(searchParams.get('fromDate')!)
        : undefined,
      createdBefore: searchParams?.get('toDate')
        ? new Date(searchParams.get('toDate')!)
        : undefined,
    }

    // Nettoyer les filtres undefined
    Object.keys(filters).forEach((key) => {
      const filterKey = key as keyof NotificationFilters
      if (
        filters[filterKey] === undefined ||
        (Array.isArray(filters[filterKey]) && (filters[filterKey] as unknown[]).length === 0)
      ) {
        delete filters[filterKey]
      }
    })

    const result = await notificationService?.getNotifications(filters, userId)

    // Simuler un délai d'API

    return NextResponse?.json(result)
  } catch (_error) {
    return NextResponse?.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()

    // Valider les données requises
    if (!body?.type || !body?.category || !body?.title || !body?.message) {
      return NextResponse?.json(
        { error: 'Missing required fields: type, category, title, message' },
        { status: 400 }
      )
    }

    const notificationRequest: CreateNotificationRequest = {
      type: body.type,
      category: body.category,
      title: body.title,
      message: body.message,
      priority: body.priority || 'NORMAL',
      source: body.source,
      entityType: body.entityType,
      entityId: body.entityId,
      data: body.data,
      recipientType: body.recipientType || 'all',
      recipientId: body.recipientId,
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      actionType: body.actionType || 'primary',
      expiresAt: body.expiresAt,
      persistent: body.persistent !== false,
      autoRead: body.autoRead ?? false,
    }

    const notification = await notificationService?.createNotification(notificationRequest)

    // Simuler un délai d'API

    return NextResponse?.json(notification, { status: 201 })
  } catch (_error) {
    return NextResponse?.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
