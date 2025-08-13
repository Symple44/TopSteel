import {
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator'
import { Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class MenuSearchDto {
  @ApiProperty({
    description: 'Search query string for menu items',
    example: 'gestion',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'La recherche doit contenir au moins 1 caractère' })
  @MaxLength(100, { message: 'La recherche ne peut pas dépasser 100 caractères' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Sanitize the input by trimming and removing dangerous characters
      return value.trim().replace(/[<>\"'%;()&+]/g, '')
    }
    return value
  })
  q: string
}