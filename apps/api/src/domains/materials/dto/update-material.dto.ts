import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { CreateMaterialDto } from './create-material.dto'

/**
 * DTO pour la mise à jour d'un matériau
 * Tous les champs du CreateMaterialDto sont optionnels pour la mise à jour
 */
export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {
  @ApiPropertyOptional({
    description: 'Raison de la modification',
    example: 'Mise à jour des propriétés mécaniques suite aux tests'
  })
  @IsOptional()
  @IsString()
  raisonModification?: string
}