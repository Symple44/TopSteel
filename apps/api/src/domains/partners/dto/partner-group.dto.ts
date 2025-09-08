import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator'
import { GroupStatus, GroupType } from '../entities/partner-group.entity'

export class CreatePartnerGroupDto {
  @ApiProperty()
  @IsString()
  code!: string

  @ApiProperty()
  @IsString()
  name!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: GroupType })
  @IsEnum(GroupType)
  type!: GroupType

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultDiscount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTerms?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rules?: {
    requiresApproval?: boolean
    minOrderAmount?: number
    maxOrderAmount?: number
    allowedPaymentMethods?: string[]
    allowedDeliveryModes?: string[]
    blockedProducts?: string[]
    exclusiveProducts?: string[]
  }

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: {
    color?: string
    icon?: string
    tags?: string[]
    customFields?: Record<string, unknown>
  }
}

export class UpdatePartnerGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ enum: GroupType })
  @IsOptional()
  @IsEnum(GroupType)
  type?: GroupType

  @ApiPropertyOptional({ enum: GroupStatus })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultDiscount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTerms?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rules?: {
    requiresApproval?: boolean
    minOrderAmount?: number
    maxOrderAmount?: number
    allowedPaymentMethods?: string[]
    allowedDeliveryModes?: string[]
    blockedProducts?: string[]
    exclusiveProducts?: string[]
  }

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: {
    color?: string
    icon?: string
    tags?: string[]
    customFields?: Record<string, unknown>
  }
}
