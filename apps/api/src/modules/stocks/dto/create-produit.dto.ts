import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator'

export class CreateProduitDto {
  @ApiProperty({ example: 'Tôle acier 2mm' })
  @IsString()
  @MinLength(2)
  nom!: string

  @ApiProperty({ example: 'TA-2MM-001' })
  @IsString()
  @MinLength(3)
  reference!: string

  @ApiProperty({ example: 45.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  prix!: number

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  fournisseurPrincipal?: number
}
