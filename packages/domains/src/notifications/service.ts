import type {
  CreateNotificationFromTemplateRequest,
  CreateNotificationRequest,
  Notification,
  NotificationFilters,
  NotificationListResponse,
  NotificationService,
  NotificationSettings,
  NotificationStats,
  NotificationTemplate,
  UpdateNotificationRequest,
} from './types'

// Interface pour la connexion à la base de données
interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  execute(sql: string, params?: any[]): Promise<{ insertId?: number; affectedRows: number }>
}

export class NotificationDatabaseService implements NotificationService {
  constructor(private db: DatabaseConnection) {}

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const id = this.generateUUID()
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO notifications (
        id, type, category, title, message, priority,
        source, entity_type, entity_id, data,
        recipient_type, recipient_id,
        action_url, action_label, action_type,
        expires_at, persistent, auto_read,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      id,
      request.type,
      request.category,
      request.title,
      request.message,
      request.priority || 'NORMAL',
      request.source || null,
      request.entityType || null,
      request.entityId || null,
      request.data ? JSON.stringify(request.data) : null,
      request.recipientType || 'all',
      request.recipientId || null,
      request.actionUrl || null,
      request.actionLabel || null,
      request.actionType || 'primary',
      request.expiresAt || null,
      request.persistent !== false,
      request.autoRead || false,
      now,
    ]

    await this.db.execute(sql, params)

    return this.getNotificationById(id)
  }

  async getNotifications(
    filters?: NotificationFilters,
    userId?: string
  ): Promise<NotificationListResponse> {
    let sql = `
      SELECT 
        n.*,
        nr.read_at,
        CASE WHEN nr.id IS NULL THEN FALSE ELSE TRUE END as is_read
      FROM notifications n
      LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
      WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
    `

    const params: any[] = [userId || '']

    // Appliquer les filtres
    if (filters?.category && filters.category.length > 0) {
      sql += ` AND n.category IN (${filters.category.map(() => '?').join(', ')})`
      params.push(...filters.category)
    }

    if (filters?.type && filters.type.length > 0) {
      sql += ` AND n.type IN (${filters.type.map(() => '?').join(', ')})`
      params.push(...filters.type)
    }

    if (filters?.priority && filters.priority.length > 0) {
      sql += ` AND n.priority IN (${filters.priority.map(() => '?').join(', ')})`
      params.push(...filters.priority)
    }

    if (filters?.unreadOnly) {
      sql += ` AND nr.id IS NULL`
    }

    if (filters?.recipientType) {
      sql += ` AND n.recipient_type = ?`
      params.push(filters.recipientType)
    }

    if (filters?.recipientId) {
      sql += ` AND n.recipient_id = ?`
      params.push(filters.recipientId)
    }

    if (filters?.source) {
      sql += ` AND n.source = ?`
      params.push(filters.source)
    }

    if (filters?.entityType) {
      sql += ` AND n.entity_type = ?`
      params.push(filters.entityType)
    }

    if (filters?.entityId) {
      sql += ` AND n.entity_id = ?`
      params.push(filters.entityId)
    }

    if (filters?.fromDate) {
      sql += ` AND n.created_at >= ?`
      params.push(filters.fromDate)
    }

    if (filters?.toDate) {
      sql += ` AND n.created_at <= ?`
      params.push(filters.toDate)
    }

    // Filtrer selon les permissions utilisateur
    if (userId) {
      sql += ` AND (n.recipient_type = 'all' OR 
                   (n.recipient_type = 'user' AND n.recipient_id = ?) OR
                   (n.recipient_type = 'role' AND n.recipient_id IN (
                     SELECT role FROM users WHERE id = ?
                   )))`
      params.push(userId, userId)
    }

    // Trier par date (plus récentes en premier)
    sql += ` ORDER BY n.created_at DESC`

    const rows = await this.db.query(sql, params)

    const notifications = rows.map(this.mapRowToNotification)

    // Compter les non lues
    const unreadCount = notifications.filter((n) => !n.isRead).length

    return {
      notifications,
      total: notifications.length,
      unreadCount,
      hasMore: false, // TODO: Implémenter la pagination
    }
  }

  async getNotificationById(id: string): Promise<Notification> {
    const sql = `
      SELECT 
        n.*,
        nr.read_at,
        CASE WHEN nr.id IS NULL THEN FALSE ELSE TRUE END as is_read
      FROM notifications n
      LEFT JOIN notification_reads nr ON n.id = nr.notification_id
      WHERE n.id = ?
    `

    const rows = await this.db.query(sql, [id])

    if (rows.length === 0) {
      throw new Error(`Notification with id ${id} not found`)
    }

    return this.mapRowToNotification(rows[0])
  }

  async updateNotification(id: string, request: UpdateNotificationRequest): Promise<Notification> {
    const updates: string[] = []
    const params: any[] = []

    if (request.title !== undefined) {
      updates.push('title = ?')
      params.push(request.title)
    }

    if (request.message !== undefined) {
      updates.push('message = ?')
      params.push(request.message)
    }

    if (request.priority !== undefined) {
      updates.push('priority = ?')
      params.push(request.priority)
    }

    if (request.actionUrl !== undefined) {
      updates.push('action_url = ?')
      params.push(request.actionUrl)
    }

    if (request.actionLabel !== undefined) {
      updates.push('action_label = ?')
      params.push(request.actionLabel)
    }

    if (request.expiresAt !== undefined) {
      updates.push('expires_at = ?')
      params.push(request.expiresAt)
    }

    if (request.persistent !== undefined) {
      updates.push('persistent = ?')
      params.push(request.persistent)
    }

    if (updates.length === 0) {
      return this.getNotificationById(id)
    }

    const sql = `UPDATE notifications SET ${updates.join(', ')} WHERE id = ?`
    params.push(id)

    await this.db.execute(sql, params)

    return this.getNotificationById(id)
  }

  async deleteNotification(id: string): Promise<void> {
    const sql = `DELETE FROM notifications WHERE id = ?`
    await this.db.execute(sql, [id])
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const sql = `
      INSERT INTO notification_reads (id, notification_id, user_id, read_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE read_at = NOW()
    `

    await this.db.execute(sql, [this.generateUUID(), notificationId, userId])
  }

  async markAllAsRead(userId: string): Promise<void> {
    const sql = `
      INSERT INTO notification_reads (id, notification_id, user_id, read_at)
      SELECT UUID(), n.id, ?, NOW()
      FROM notifications n
      LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = ?
      WHERE nr.id IS NULL 
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
        AND (n.recipient_type = 'all' OR 
             (n.recipient_type = 'user' AND n.recipient_id = ?))
    `

    await this.db.execute(sql, [userId, userId, userId])
  }

  async getUserSettings(userId: string): Promise<NotificationSettings> {
    const sql = `SELECT * FROM notification_settings WHERE user_id = ?`
    const rows = await this.db.query(sql, [userId])

    if (rows.length === 0) {
      // Créer des paramètres par défaut
      return this.createDefaultSettings(userId)
    }

    return this.mapRowToSettings(rows[0])
  }

  async updateUserSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    const updates: string[] = []
    const params: any[] = []

    if (settings.enableSound !== undefined) {
      updates.push('enable_sound = ?')
      params.push(settings.enableSound)
    }

    if (settings.enableToast !== undefined) {
      updates.push('enable_toast = ?')
      params.push(settings.enableToast)
    }

    if (settings.enableBrowser !== undefined) {
      updates.push('enable_browser = ?')
      params.push(settings.enableBrowser)
    }

    if (settings.enableEmail !== undefined) {
      updates.push('enable_email = ?')
      params.push(settings.enableEmail)
    }

    if (settings.categories !== undefined) {
      updates.push('categories = ?')
      params.push(JSON.stringify(settings.categories))
    }

    if (settings.priorities !== undefined) {
      updates.push('priorities = ?')
      params.push(JSON.stringify(settings.priorities))
    }

    if (settings.schedules !== undefined) {
      updates.push('schedules = ?')
      params.push(JSON.stringify(settings.schedules))
    }

    if (updates.length > 0) {
      const sql = `
        UPDATE notification_settings 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE user_id = ?
      `
      params.push(userId)

      await this.db.execute(sql, params)
    }

    return this.getUserSettings(userId)
  }

  async createNotificationFromTemplate(
    request: CreateNotificationFromTemplateRequest
  ): Promise<Notification> {
    // Récupérer le template
    const templateSql = `SELECT * FROM notification_templates WHERE name = ?`
    const templateRows = await this.db.query(templateSql, [request.templateName])

    if (templateRows.length === 0) {
      throw new Error(`Template ${request.templateName} not found`)
    }

    const template = templateRows[0]

    // Remplacer les variables dans le template
    const title = this.replaceVariables(template.title_template, request.variables)
    const message = this.replaceVariables(template.message_template, request.variables)
    const actionUrl = template.action_url_template
      ? this.replaceVariables(template.action_url_template, request.variables)
      : undefined

    // Créer la notification
    const notificationRequest: CreateNotificationRequest = {
      type: template.type,
      category: template.category,
      title,
      message,
      priority: template.priority,
      recipientType: request.recipientType,
      recipientId: request.recipientId,
      actionUrl,
      actionLabel: template.action_label,
      persistent: template.persistent,
      source: `template:${request.templateName}`,
      data: request.variables,
    }

    return this.createNotification(notificationRequest)
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    const sql = `SELECT * FROM notification_templates ORDER BY name`
    const rows = await this.db.query(sql)

    return rows.map(this.mapRowToTemplate)
  }

  async getUserStats(userId: string): Promise<NotificationStats> {
    const sql = `SELECT * FROM user_notification_stats WHERE user_id = ?`
    const rows = await this.db.query(sql, [userId])

    if (rows.length === 0) {
      return {
        userId,
        totalNotifications: 0,
        unreadCount: 0,
        systemCount: 0,
        stockCount: 0,
        projetCount: 0,
        productionCount: 0,
        maintenanceCount: 0,
        qualiteCount: 0,
        facturationCount: 0,
        sauvegardeCount: 0,
        utilisateurCount: 0,
        urgentUnreadCount: 0,
      }
    }

    return this.mapRowToStats(rows[0])
  }

  async cleanExpiredNotifications(): Promise<number> {
    const sql = `CALL CleanExpiredNotifications()`
    const result = await this.db.query(sql)
    return result[0]?.deleted_count || 0
  }

  // Méthodes utilitaires privées
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      type: row.type,
      category: row.category,
      title: row.title,
      message: row.message,
      priority: row.priority,
      source: row.source,
      entityType: row.entity_type,
      entityId: row.entity_id,
      data: row.data ? JSON.parse(row.data) : undefined,
      recipientType: row.recipient_type,
      recipientId: row.recipient_id,
      actionUrl: row.action_url,
      actionLabel: row.action_label,
      actionType: row.action_type || 'primary',
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      persistent: row.persistent,
      autoRead: row.auto_read,
      isRead: row.is_read,
      readAt: row.read_at,
      metadata: {
        category: row.category,
        source: row.source,
        entityType: row.entity_type,
        entityId: row.entity_id,
        userId: row.recipient_type === 'user' ? row.recipient_id : undefined,
      },
      actions: row.action_url
        ? [
            {
              url: row.action_url,
              label: row.action_label || 'Voir',
              type: row.action_type || 'primary',
            },
          ]
        : undefined,
    }
  }

  private mapRowToSettings(row: any): NotificationSettings {
    return {
      id: row.id,
      userId: row.user_id,
      enableSound: row.enable_sound,
      enableToast: row.enable_toast,
      enableBrowser: row.enable_browser,
      enableEmail: row.enable_email,
      categories: row.categories ? JSON.parse(row.categories) : {},
      priorities: row.priorities ? JSON.parse(row.priorities) : {},
      schedules: row.schedules ? JSON.parse(row.schedules) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapRowToTemplate(row: any): NotificationTemplate {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      category: row.category,
      titleTemplate: row.title_template,
      messageTemplate: row.message_template,
      priority: row.priority,
      persistent: row.persistent,
      actionUrlTemplate: row.action_url_template,
      actionLabel: row.action_label,
      variables: row.variables ? JSON.parse(row.variables) : {},
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private mapRowToStats(row: any): NotificationStats {
    return {
      userId: row.user_id,
      totalNotifications: row.total_notifications || 0,
      unreadCount: row.unread_count || 0,
      systemCount: row.system_count || 0,
      stockCount: row.stock_count || 0,
      projetCount: row.projet_count || 0,
      productionCount: row.production_count || 0,
      maintenanceCount: row.maintenance_count || 0,
      qualiteCount: row.qualite_count || 0,
      facturationCount: row.facturation_count || 0,
      sauvegardeCount: row.sauvegarde_count || 0,
      utilisateurCount: row.utilisateur_count || 0,
      urgentUnreadCount: row.urgent_unread_count || 0,
    }
  }

  private async createDefaultSettings(userId: string): Promise<NotificationSettings> {
    const id = this.generateUUID()
    const now = new Date().toISOString()

    const defaultSettings: NotificationSettings = {
      id,
      userId,
      enableSound: true,
      enableToast: true,
      enableBrowser: true,
      enableEmail: false,
      categories: {
        system: true,
        stock: true,
        projet: true,
        production: true,
        maintenance: true,
        qualite: true,
        facturation: true,
        sauvegarde: false,
        utilisateur: true,
      },
      priorities: {
        low: false,
        normal: true,
        high: true,
        urgent: true,
      },
      schedules: {
        workingHours: {
          enabled: false,
          start: '09:00',
          end: '18:00',
        },
        weekdays: {
          enabled: false,
          days: [1, 2, 3, 4, 5],
        },
      },
      createdAt: now,
      updatedAt: now,
    }

    const sql = `
      INSERT INTO notification_settings (
        id, user_id, enable_sound, enable_toast, enable_browser, enable_email,
        categories, priorities, schedules, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await this.db.execute(sql, [
      id,
      userId,
      defaultSettings.enableSound,
      defaultSettings.enableToast,
      defaultSettings.enableBrowser,
      defaultSettings.enableEmail,
      JSON.stringify(defaultSettings.categories),
      JSON.stringify(defaultSettings.priorities),
      JSON.stringify(defaultSettings.schedules),
      now,
      now,
    ])

    return defaultSettings
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match
    })
  }
}
