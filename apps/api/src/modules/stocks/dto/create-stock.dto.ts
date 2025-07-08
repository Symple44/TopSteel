import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateStockDto {
  @ApiProperty({ description: 'Référence du produit' })
  @IsString()
  reference!: string

  @ApiProperty({ description: 'Désignation du produit' })
  @IsString()
  designation!: string

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ description: 'Quantité en stock' })
  @IsNumber()
  @IsOptional()
  quantiteStock?: number

  @ApiPropertyOptional({ description: 'Quantité minimum' })
  @IsNumber()
  @IsOptional()
  quantiteMin?: number

  @ApiPropertyOptional({ description: "Prix d'achat" })
  @IsNumber()
  @IsOptional()
  prixAchat?: number

  @ApiPropertyOptional({ description: 'Emplacement' })
  @IsString()
  @IsOptional()
  emplacement?: string
}
