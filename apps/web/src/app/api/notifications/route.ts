import { NextRequest, NextResponse } from 'next/server'
import { 
  NotificationDatabaseService,
  CreateNotificationRequest, 
  NotificationFilters,
  NotificationCategory,
  NotificationPriority,
  NotificationType 
} from '@erp/domains/notifications'

// Mock de connexion à la base de données (à remplacer par la vraie connexion)
class MockDatabaseConnection {
  private notifications: any[] = []
  private settings: any[] = []
  private reads: any[] = []

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    // Simulation basique pour les tests
    if (sql.includes('notification_settings')) {
      return this.settings as T[]
    }
    if (sql.includes('notification_reads')) {
      return this.reads as T[]
    }
    if (sql.includes('notifications')) {
      return this.notifications as T[]
    }
    return [] as T[]
  }

  async execute(sql: string, params?: any[]): Promise<{ insertId?: number; affectedRows: number }> {
    // Simulation basique pour les tests
    if (sql.includes('INSERT INTO notifications')) {
      const notification = {
        id: params?.[0] || this.generateUUID(),
        type: params?.[1] || 'info',
        category: params?.[2] || 'system',
        title: params?.[3] || 'Test',
        message: params?.[4] || 'Test message',
        priority: params?.[5] || 'NORMAL',
        source: params?.[6],
        entity_type: params?.[7],
        entity_id: params?.[8],
        data: params?.[9],
        recipient_type: params?.[10] || 'all',
        recipient_id: params?.[11],
        action_url: params?.[12],
        action_label: params?.[13],
        action_type: params?.[14] || 'primary',
        expires_at: params?.[15],
        persistent: params?.[16] !== false,
        auto_read: params?.[17] || false,
        created_at: params?.[18] || new Date().toISOString(),
        is_read: false,
        read_at: null
      }
      this.notifications.unshift(notification)
      return { affectedRows: 1 }
    }
    return { affectedRows: 0 }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Initialiser avec quelques données de test
  constructor() {
    this.initializeMockData()
  }

  private initializeMockData() {
    const baseDate = new Date()
    
    this.notifications = [
      {
        id: '1',
        type: 'info',
        category: 'system',
        title: 'Mise à jour système',
        message: 'Le système a été mis à jour vers la version 2.1.0',
        priority: 'NORMAL',
        source: 'auto-update',
        entity_type: null,
        entity_id: null,
        data: null,
        recipient_type: 'all',
        recipient_id: null,
        action_url: '/changelog',
        action_label: 'Voir les notes',
        action_type: 'primary',
        expires_at: null,
        persistent: true,
        auto_read: false,
        created_at: new Date(baseDate.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        is_read: false,
        read_at: null
      },
      {
        id: '2',
        type: 'warning',
        category: 'stock',
        title: 'Stock faible',
        message: 'Le stock de tôles acier 2mm est en dessous du seuil critique (5 unités restantes)',
        priority: 'HIGH',
        source: 'inventory-check',
        entity_type: 'material',
        entity_id: 'STEEL_2MM',
        data: JSON.stringify({ quantity: 5, threshold: 10 }),
        recipient_type: 'all',
        recipient_id: null,
        action_url: '/commandes/nouveau?material=STEEL_2MM',
        action_label: 'Passer commande',
        action_type: 'primary',
        expires_at: null,
        persistent: true,
        auto_read: false,
        created_at: new Date(baseDate.getTime() - 30 * 60 * 1000).toISOString(),
        is_read: false,
        read_at: null
      },
      {
        id: '3',
        type: 'success',
        category: 'sauvegarde',
        title: 'Sauvegarde réussie',
        message: 'La sauvegarde automatique des données a été effectuée avec succès',
        priority: 'NORMAL',
        source: 'auto-backup',
        entity_type: null,
        entity_id: null,
        data: null,
        recipient_type: 'all',
        recipient_id: null,
        action_url: null,
        action_label: null,
        action_type: 'primary',
        expires_at: null,
        persistent: false,
        auto_read: false,
        created_at: new Date(baseDate.getTime() - 60 * 60 * 1000).toISOString(),
        is_read: true,
        read_at: new Date(baseDate.getTime() - 50 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'info',
        category: 'utilisateur',
        title: 'Nouveau message',
        message: 'Marie Dubois a ajouté un commentaire sur le projet "Charpente industrielle"',
        priority: 'NORMAL',
        source: 'user-action',
        entity_type: 'project',
        entity_id: 'PROJ_001',
        data: JSON.stringify({ userId: 'marie.dubois', projectName: 'Charpente industrielle' }),
        recipient_type: 'all',
        recipient_id: null,
        action_url: '/projets/PROJ_001',
        action_label: 'Voir le projet',
        action_type: 'primary',
        expires_at: null,
        persistent: true,
        auto_read: false,
        created_at: new Date(baseDate.getTime() - 10 * 60 * 1000).toISOString(),
        is_read: false,
        read_at: null
      }
    ]
  }
}

// Créer une instance du service
const mockDb = new MockDatabaseConnection()
const notificationService = new NotificationDatabaseService(mockDb)

export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'user-1' // TODO: Récupérer depuis l'auth
    
    const filters: NotificationFilters = {
      category: searchParams.get('category')?.split(',') as NotificationCategory[],
      type: searchParams.get('type')?.split(',') as NotificationType[],
      priority: searchParams.get('priority')?.split(',') as NotificationPriority[],
      unreadOnly: searchParams.get('unread') === 'true',
      recipientType: searchParams.get('recipientType') as any,
      recipientId: searchParams.get('recipientId') || undefined,
      source: searchParams.get('source') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    }

    // Nettoyer les filtres undefined
    Object.keys(filters).forEach(key => {
      const filterKey = key as keyof NotificationFilters
      if (filters[filterKey] === undefined || 
          (Array.isArray(filters[filterKey]) && (filters[filterKey] as any[]).length === 0)) {
        delete filters[filterKey]
      }
    })

    const result = await notificationService.getNotifications(filters, userId)

    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Valider les données requises
    if (!body.type || !body.category || !body.title || !body.message) {
      return NextResponse.json(
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
      autoRead: body.autoRead || false,
    }

    const notification = await notificationService.createNotification(notificationRequest)

    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 100))

    return NextResponse.json(notification, { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}