import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'Mot de passe actuel',
  })
  @IsString()
  currentPassword!: string

  @ApiProperty({
    example: 'newPassword456',
    description: 'Nouveau mot de passe',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword!: string
}
