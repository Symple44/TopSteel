import { IsOptional, IsBoolean, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class NotificationEmailTypesUpdateDto {
  @ApiProperty({ description: 'Notifications pour nouveaux messages', required: false })
  @IsBoolean()
  @IsOptional()
  newMessages?: boolean

  @ApiProperty({ description: 'Alertes système', required: false })
  @IsBoolean()
  @IsOptional()
  systemAlerts?: boolean

  @ApiProperty({ description: 'Rappels de tâches', required: false })
  @IsBoolean()
  @IsOptional()
  taskReminders?: boolean

  @ApiProperty({ description: 'Rapports hebdomadaires', required: false })
  @IsBoolean()
  @IsOptional()
  weeklyReports?: boolean

  @ApiProperty({ description: 'Alertes de sécurité', required: false })
  @IsBoolean()
  @IsOptional()
  securityAlerts?: boolean

  @ApiProperty({ description: 'Avis de maintenance', required: false })
  @IsBoolean()
  @IsOptional()
  maintenanceNotice?: boolean
}

export class NotificationPushTypesUpdateDto {
  @ApiProperty({ description: 'Activer les notifications push', required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @ApiProperty({ description: 'Sons de notification', required: false })
  @IsBoolean()
  @IsOptional()
  sound?: boolean

  @ApiProperty({ description: 'Notifications urgentes', required: false })
  @IsBoolean()
  @IsOptional()
  urgent?: boolean

  @ApiProperty({ description: 'Notifications normales', required: false })
  @IsBoolean()
  @IsOptional()
  normal?: boolean

  @ApiProperty({ description: 'Notifications discrètes', required: false })
  @IsBoolean()
  @IsOptional()
  quiet?: boolean
}

export class NotificationQuietHoursUpdateDto {
  @ApiProperty({ description: 'Activer le mode silencieux', required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @ApiProperty({ description: 'Heure de début (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  start?: string

  @ApiProperty({ description: 'Heure de fin (HH:mm)', required: false })
  @IsString()
  @IsOptional()
  end?: string
}

export class UpdateNotificationSettingsDto {
  @ApiProperty({ description: 'Notifications par email', required: false })
  @IsBoolean()
  @IsOptional()
  email?: boolean

  @ApiProperty({ description: 'Notifications push', required: false })
  @IsBoolean()
  @IsOptional()
  push?: boolean

  @ApiProperty({ description: 'Notifications SMS', required: false })
  @IsBoolean()
  @IsOptional()
  sms?: boolean

  @ApiProperty({ type: NotificationEmailTypesUpdateDto, required: false })
  @IsOptional()
  @Type(() => NotificationEmailTypesUpdateDto)
  emailTypes?: NotificationEmailTypesUpdateDto

  @ApiProperty({ type: NotificationPushTypesUpdateDto, required: false })
  @IsOptional()
  @Type(() => NotificationPushTypesUpdateDto)
  pushTypes?: NotificationPushTypesUpdateDto

  @ApiProperty({ type: NotificationQuietHoursUpdateDto, required: false })
  @IsOptional()
  @Type(() => NotificationQuietHoursUpdateDto)
  quietHours?: NotificationQuietHoursUpdateDto
}

export class GetNotificationSettingsResponseDto {
  @ApiProperty()
  email: boolean

  @ApiProperty()
  push: boolean

  @ApiProperty()
  sms: boolean

  @ApiProperty({ 
    type: 'object',
    properties: {
      newMessages: { type: 'boolean' },
      systemAlerts: { type: 'boolean' },
      taskReminders: { type: 'boolean' },
      weeklyReports: { type: 'boolean' },
      securityAlerts: { type: 'boolean' },
      maintenanceNotice: { type: 'boolean' }
    }
  })
  emailTypes: {
    newMessages: boolean
    systemAlerts: boolean
    taskReminders: boolean
    weeklyReports: boolean
    securityAlerts: boolean
    maintenanceNotice: boolean
  }

  @ApiProperty({ 
    type: 'object',
    properties: {
      enabled: { type: 'boolean' },
      sound: { type: 'boolean' },
      urgent: { type: 'boolean' },
      normal: { type: 'boolean' },
      quiet: { type: 'boolean' }
    }
  })
  pushTypes: {
    enabled: boolean
    sound: boolean
    urgent: boolean
    normal: boolean
    quiet: boolean
  }

  @ApiProperty({ 
    type: 'object',
    properties: {
      enabled: { type: 'boolean' },
      start: { type: 'string' },
      end: { type: 'string' }
    }
  })
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }

  constructor(data: any) {
    this.email = data.email
    this.push = data.push
    this.sms = data.sms
    this.emailTypes = data.emailTypes
    this.pushTypes = data.pushTypes
    this.quietHours = data.quietHours
  }
}