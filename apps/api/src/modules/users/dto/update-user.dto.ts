import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString, MinLength } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'])) {
  @ApiPropertyOptional({ example: 'nouveaumotdepasse123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string
}
