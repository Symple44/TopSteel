// apps/api/src/modules/notifications/dto/create-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator'

// Import from shared types
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
  REMINDER = 'REMINDER',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Type de notification',
    enum: NotificationType,
    example: NotificationType.INFO,
    enumName: 'NotificationType',
  })
  @IsEnum(NotificationType, {
    message:
      'Le type doit être une valeur valide: info, success, warning, error, projet_update, stock_alert, task_assigned',
  })
  type!: NotificationType // ✅ CORRIGÉ : Type enum au lieu de string

  @ApiProperty({ description: 'Titre de la notification' })
  @IsString()
  title!: string

  @ApiProperty({ description: 'Message de la notification' })
  @IsString()
  message!: string

  @ApiPropertyOptional({ description: 'Données additionnelles' })
  @IsObject()
  @IsOptional()
  data?: unknown

  @ApiPropertyOptional({ description: "ID de l'utilisateur" })
  @IsString()
  @IsOptional()
  userId?: string

  @ApiPropertyOptional({ description: 'ID du projet' })
  @IsString()
  @IsOptional()
  projetId?: string
}
