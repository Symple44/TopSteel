import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateDocumentDto {
  @ApiProperty({ description: 'Nom du document' })
  @IsString()
  nom!: string

  @ApiProperty({ description: 'Type du document' })
  @IsEnum(['pdf', 'image', 'document', 'plan'])
  type!: 'pdf' | 'image' | 'document' | 'plan'

  @ApiProperty({ description: 'URL du document' })
  @IsString()
  url!: string

  @ApiPropertyOptional({ description: 'Taille du fichier' })
  @IsNumber()
  @IsOptional()
  taille?: number

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string
}
