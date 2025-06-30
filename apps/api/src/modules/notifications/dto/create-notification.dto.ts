import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Type de notification' })
  @IsEnum(['info', 'success', 'warning', 'error', 'projet_update', 'stock_alert', 'task_assigned'])
  type!: string;

  @ApiProperty({ description: 'Titre de la notification' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Message de la notification' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Données additionnelles' })
  @IsObject()
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID du projet' })
  @IsString()
  @IsOptional()
  projetId?: string;
}
