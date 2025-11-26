import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'

import { NotificationsController } from './notifications.controller'
import { NotificationsGateway } from './notifications.gateway'
import { NotificationsService } from './notifications.service'
import { NotificationsPrismaModule } from '../../domains/notifications/prisma/notifications-prisma.module'

@Module({
  imports: [
    DatabaseModule,
    NotificationsPrismaModule, // Prisma-based notification services
  ],
  controllers: [
    NotificationsController, // Clean - uses pure Prisma
  ],
  providers: [
    NotificationsService, // Clean - uses pure Prisma
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
