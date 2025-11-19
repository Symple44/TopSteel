import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { UsageMetricType } from '@prisma/client'

/**
 * DTO for recording license usage
 */
export class RecordUsageDto {
  @ApiProperty({ description: 'Type of usage metric', enum: UsageMetricType })
  @IsNotEmpty()
  @IsEnum(UsageMetricType)
  metricType: UsageMetricType

  @ApiProperty({ description: 'Metric name' })
  @IsNotEmpty()
  @IsString()
  metricName: string

  @ApiProperty({ description: 'Usage value' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  value: number

  @ApiPropertyOptional({ description: 'Usage limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number

  @ApiPropertyOptional({ description: 'Date of recording' })
  @IsOptional()
  recordedAt?: Date

  @ApiPropertyOptional({ description: 'Usage breakdown by category (JSON)' })
  @IsOptional()
  breakdown?: any

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)' })
  @IsOptional()
  metadata?: any
}

/**
 * DTO for querying usage statistics
 */
export class UsageStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Time period for statistics',
    enum: ['day', 'week', 'month', 'year'],
    default: 'month',
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year'

  @ApiPropertyOptional({ description: 'Start date for range query' })
  @IsOptional()
  startDate?: Date

  @ApiPropertyOptional({ description: 'End date for range query' })
  @IsOptional()
  endDate?: Date
}

/**
 * DTO for querying usage by metric type
 */
export class UsageByMetricQueryDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  startDate?: Date

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  endDate?: Date

  @ApiPropertyOptional({ description: 'Group by period', enum: ['hour', 'day', 'week', 'month'] })
  @IsOptional()
  @IsString()
  groupBy?: 'hour' | 'day' | 'week' | 'month'
}

/**
 * DTO for checking usage threshold
 */
export class CheckThresholdDto {
  @ApiProperty({ description: 'Metric type to check', enum: UsageMetricType })
  @IsNotEmpty()
  @IsEnum(UsageMetricType)
  metricType: UsageMetricType

  @ApiPropertyOptional({ description: 'Threshold percentage (0-100)', default: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold?: number
}
