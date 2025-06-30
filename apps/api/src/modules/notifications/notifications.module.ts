// apps/api/src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notifications.entity'; // ← Import corrigé
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])], // ← Nom corrigé
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}