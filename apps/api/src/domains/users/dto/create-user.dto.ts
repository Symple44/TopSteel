import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { UserRole } from '../entities/user.entity'

export class CreateUserDto {
  @ApiProperty({ example: 'Dupont', minLength: 2, maxLength: 255 })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  nom!: string

  @ApiProperty({ example: 'Jean', minLength: 2, maxLength: 255 })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  prenom!: string

  @ApiProperty({ example: 'jean.dupont@example.com' })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string

  @ApiProperty({ example: 'motdepasse123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.OPERATEUR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.OPERATEUR

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean = true

  @ApiPropertyOptional({ example: "Description de l'utilisateur" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>
}
import { User } from '@prisma/client'
