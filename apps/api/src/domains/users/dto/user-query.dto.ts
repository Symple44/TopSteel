import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional } from 'class-validator'
import { BaseQueryDto } from '../../../core/common/dto/base.dto'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'

// Alias for backward compatibility
const UserRole = GlobalUserRole

export class UserQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  actif?: boolean

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: GlobalUserRole
}
