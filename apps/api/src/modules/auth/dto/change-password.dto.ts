// apps/api/src/modules/auth/dto/change-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Ancien mot de passe',
    example: 'oldPassword123!',
  })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (min 8 caractères, doit contenir maj, min, chiffre et caractère spécial)',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  newPassword!: string;
}