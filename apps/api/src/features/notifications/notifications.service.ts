import { Injectable, NotFoundException } from '@nestjs/common'
import { NotificationPrismaService } from '../../domains/notifications/prisma/notification-prisma.service'
import type { PaginationResultDto } from '../../core/common/dto/base.dto'
import type { CreateNotificationsDto } from './dto/create-notifications.dto'
import type { NotificationsQueryDto } from './dto/notifications-query.dto'
import type { UpdateNotificationsDto } from './dto/update-notifications.dto'
import type { Notification } from '@prisma/client'

/**
 * NotificationsService - Clean Prisma implementation
 * Wrapper autour de NotificationPrismaService pour l'API
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly notificationPrismaService: NotificationPrismaService) {}

  async create(createDto: CreateNotificationsDto): Promise<Notification> {
    // Pour l'instant, on utilise des valeurs par défaut pour userId et societeId
    // TODO: Récupérer userId et societeId depuis le contexte de la requête (JWT)
    return this.notificationPrismaService.create({
      userId: '', // TODO: Get from request context
      societeId: '', // TODO: Get from request context
      type: createDto.type || 'INFO',
      title: createDto.title,
      message: createDto.message,
    })
  }

  async findAll(query: NotificationsQueryDto): Promise<PaginationResultDto<Notification>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC', type } = query

    return this.notificationPrismaService.findAll({
      page,
      limit,
      search,
      type,
      sortBy,
      sortOrder: sortOrder as 'ASC' | 'DESC',
    })
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationPrismaService.findOne(id)
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`)
    }
    return notification
  }

  async update(id: string, updateDto: UpdateNotificationsDto): Promise<Notification> {
    // Vérifier que la notification existe
    await this.findOne(id)
    return this.notificationPrismaService.update(id, updateDto)
  }

  async remove(id: string): Promise<void> {
    // Vérifier que la notification existe
    await this.findOne(id)
    return this.notificationPrismaService.remove(id)
  }

  async getStats(): Promise<{
    total: number
    read: number
    unread: number
    expired: number
  }> {
    return this.notificationPrismaService.getStats()
  }
}
