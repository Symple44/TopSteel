import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Notifications } from './entities/notifications.entity'
import { NotificationsController } from './notifications.controller'
import { NotificationsGateway } from './notifications.gateway'
import { NotificationsService } from './notifications.service'
import { NotificationsPrismaModule } from '../../domains/notifications/prisma/notifications-prisma.module'

@Module({
  imports: [
    NotificationsPrismaModule, // Prisma-based notification services
    TypeOrmModule.forFeature([Notifications], 'auth'),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
