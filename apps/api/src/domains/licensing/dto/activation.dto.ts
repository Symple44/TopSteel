import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

/**
 * DTO for creating a license activation on a machine
 */
export class CreateActivationDto {
  @ApiProperty({ description: 'Unique machine identifier' })
  @IsNotEmpty()
  @IsString()
  machineId: string

  @ApiPropertyOptional({ description: 'Machine name' })
  @IsOptional()
  @IsString()
  machineName?: string

  @ApiPropertyOptional({ description: 'Operating system type' })
  @IsOptional()
  @IsString()
  osType?: string

  @ApiPropertyOptional({ description: 'Operating system version' })
  @IsOptional()
  @IsString()
  osVersion?: string

  @ApiPropertyOptional({ description: 'Machine hostname' })
  @IsOptional()
  @IsString()
  hostname?: string

  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string

  @ApiPropertyOptional({ description: 'MAC address' })
  @IsOptional()
  @IsString()
  macAddress?: string

  @ApiPropertyOptional({ description: 'Maximum heartbeat interval in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHeartbeatInterval?: number

  @ApiPropertyOptional({ description: 'Hardware information (JSON)' })
  @IsOptional()
  hardwareInfo?: any

  @ApiPropertyOptional({ description: 'Software information (JSON)' })
  @IsOptional()
  softwareInfo?: any

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)' })
  @IsOptional()
  metadata?: any
}

/**
 * DTO for updating heartbeat
 */
export class UpdateHeartbeatDto {
  @ApiPropertyOptional({ description: 'Updated hardware info' })
  @IsOptional()
  hardwareInfo?: any

  @ApiPropertyOptional({ description: 'Updated software info' })
  @IsOptional()
  softwareInfo?: any

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any
}

/**
 * DTO for deactivating a machine
 */
export class DeactivateActivationDto {
  @ApiPropertyOptional({ description: 'Reason for deactivation' })
  @IsOptional()
  @IsString()
  reason?: string
}
