import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'

// Alias for backward compatibility
const UserRole = GlobalUserRole


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

  @ApiProperty({
    example: 'SecureP@ss123',
    minLength: 8,
    description: 'Password must be at least 8 characters and contain: uppercase letter, lowercase letter, number, and special character (!@#$%^&*...)'
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message: 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial (!@#$%^&*...)',
    }
  )
  password!: string

  @ApiPropertyOptional({ enum: GlobalUserRole, default: GlobalUserRole.OPERATEUR })
  @IsOptional()
  @IsEnum(GlobalUserRole)
  role?: GlobalUserRole = GlobalUserRole.OPERATEUR

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

