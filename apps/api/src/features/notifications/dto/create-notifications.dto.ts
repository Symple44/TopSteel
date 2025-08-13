import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { NotificationType } from '../entities/notifications.entity'

export class CreateNotificationsDto {
  @ApiProperty({
    example: 'Titre de la notification',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  title!: string

  @ApiProperty({ example: 'Message détaillé' })
  @IsString()
  @MaxLength(2000)
  message!: string

  @ApiPropertyOptional({
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType = NotificationType.INFO

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean = false

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>
}
