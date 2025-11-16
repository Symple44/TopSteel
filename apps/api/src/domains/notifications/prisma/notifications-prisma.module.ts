import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { NotificationPrismaService } from './notification-prisma.service'
import { NotificationEventPrismaService } from './notification-event-prisma.service'
import { NotificationTemplatePrismaService } from './notification-template-prisma.service'
import { NotificationSettingsPrismaService } from './notification-settings-prisma.service'
import { NotificationRulePrismaService } from './notification-rule-prisma.service'
import { NotificationRuleExecutionPrismaService } from './notification-rule-execution-prisma.service'
import { NotificationReadPrismaService } from './notification-read-prisma.service'
import { NotificationsPrismaController } from './notifications-prisma.controller'

/**
 * NotificationsPrismaModule - Phase 2.5 + Phase 5.6-5.7 (Complete - 7/7 entities + 1 controller)
 *
 * Module pour gestion des notifications avec Prisma
 *
 * Provides:
 * - NotificationPrismaService pour notifications utilisateur
 * - NotificationEventPrismaService pour événements déclencheurs
 * - NotificationTemplatePrismaService pour templates réutilisables
 * - NotificationSettingsPrismaService pour préférences utilisateur
 * - NotificationRulePrismaService pour règles automatiques
 * - NotificationRuleExecutionPrismaService pour historique d'exécution
 * - NotificationReadPrismaService pour tracking de lecture
 * - NotificationsPrismaController pour endpoints REST (Phase 5.6-5.7)
 */
@Module({
  imports: [PrismaModule],
  controllers: [NotificationsPrismaController],
  providers: [
    NotificationPrismaService,
    NotificationEventPrismaService,
    NotificationTemplatePrismaService,
    NotificationSettingsPrismaService,
    NotificationRulePrismaService,
    NotificationRuleExecutionPrismaService,
    NotificationReadPrismaService,
  ],
  exports: [
    NotificationPrismaService,
    NotificationEventPrismaService,
    NotificationTemplatePrismaService,
    NotificationSettingsPrismaService,
    NotificationRulePrismaService,
    NotificationRuleExecutionPrismaService,
    NotificationReadPrismaService,
  ],
})
export class NotificationsPrismaModule {}
