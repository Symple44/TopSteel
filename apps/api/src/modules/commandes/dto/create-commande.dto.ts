// create-commande.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator'

export class CreateCommandeDto {
  @ApiProperty({ example: 'CMD-2025-001' })
  @IsString()
  numero!: string

  @ApiProperty({ example: 1250.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  montant!: number

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  fournisseur?: number
}
