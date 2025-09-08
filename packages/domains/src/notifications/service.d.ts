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
interface DatabaseConnection {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
  execute(
    sql: string,
    params?: unknown[]
  ): Promise<{
    insertId?: number
    affectedRows: number
  }>
}
export declare class NotificationDatabaseService implements NotificationService {
  private db
  constructor(db: DatabaseConnection)
  createNotification(request: CreateNotificationRequest): Promise<Notification>
  getNotifications(
    filters?: NotificationFilters,
    userId?: string
  ): Promise<NotificationListResponse>
  getNotificationById(id: string): Promise<Notification>
  updateNotification(id: string, request: UpdateNotificationRequest): Promise<Notification>
  deleteNotification(id: string): Promise<void>
  markAsRead(notificationId: string, userId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  getUserSettings(userId: string): Promise<NotificationSettings>
  updateUserSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings>
  createNotificationFromTemplate(
    request: CreateNotificationFromTemplateRequest
  ): Promise<Notification>
  getTemplates(): Promise<NotificationTemplate[]>
  getUserStats(userId: string): Promise<NotificationStats>
  cleanExpiredNotifications(): Promise<number>
  private generateUUID
  private mapRowToNotification
  private mapRowToSettings
  private mapRowToTemplate
  private mapRowToStats
  private createDefaultSettings
  private replaceVariables
}
//# sourceMappingURL=service.d.ts.map
