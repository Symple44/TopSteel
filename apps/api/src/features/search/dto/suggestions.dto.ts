import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class SuggestionsDto {
  @ApiProperty({
    description: 'Search query string for suggestions',
    example: 'cli',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'La requête doit contenir au moins 1 caractère' })
  @MaxLength(100, { message: 'La requête ne peut pas dépasser 100 caractères' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Sanitize the input by trimming and removing dangerous characters
      return value.trim().replace(/[<>"'%;()&+]/g, '')
    }
    return value
  })
  q: string
}
