import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString, Matches, MinLength } from 'class-validator'
import { CreateUserDto } from './create-user.dto'

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'])) {
  @ApiPropertyOptional({
    example: 'SecureP@ss123',
    minLength: 8,
    description: 'Password must be at least 8 characters and contain: uppercase letter, lowercase letter, number, and special character (!@#$%^&*...)'
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
    {
      message: 'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial (!@#$%^&*...)',
    }
  )
  password?: string
}
