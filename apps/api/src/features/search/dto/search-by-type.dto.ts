import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

// Valid entity types based on searchable-entities.config.ts
const VALID_ENTITY_TYPES = [
  'menu',
  'client',
  'fournisseur',
  'article',
  'material',
  'shared_material',
  'projet',
  'devis',
  'facture',
  'commande',
  'user',
  'societe',
  'price_rule',
  'notification',
  'query',
] as const

export class SearchByTypeParamsDto {
  @ApiProperty({
    description: 'Entity type to search in',
    example: 'client',
    enum: VALID_ENTITY_TYPES,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_ENTITY_TYPES, {
    message: `Le type doit être l'un des suivants: ${VALID_ENTITY_TYPES.join(', ')}`,
  })
  type: string
}

export class SearchByTypeQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'client ABC',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'La recherche doit contenir au moins 2 caractères' })
  @MaxLength(200, { message: 'La recherche ne peut pas dépasser 200 caractères' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Sanitize the input by trimming and removing dangerous characters
      return value.trim().replace(/[<>\"'%;()&+]/g, '')
    }
    return value
  })
  q: string

  @ApiProperty({
    description: 'Maximum number of results to return',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? 20 : parsed
    }
    return value
  })
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier' })
  @Min(1, { message: 'La limite doit être au minimum 1' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100' })
  limit?: number = 20

  @ApiProperty({
    description: 'Number of results to skip (for pagination)',
    example: 0,
    required: false,
    minimum: 0,
    maximum: 10000,
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return value
  })
  @Type(() => Number)
  @IsInt({ message: 'L\'offset doit être un nombre entier' })
  @Min(0, { message: 'L\'offset doit être au minimum 0' })
  @Max(10000, { message: 'L\'offset ne peut pas dépasser 10000' })
  offset?: number = 0
}