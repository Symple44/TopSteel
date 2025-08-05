import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { CreatePartnerDto } from './create-partner.dto'

/**
 * DTO pour la mise à jour d'un partenaire
 * Tous les champs du CreatePartnerDto sont optionnels pour la mise à jour
 */
export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {
  @ApiPropertyOptional({
    description: 'Raison de la modification',
    example: 'Mise à jour des coordonnées suite à déménagement',
  })
  @IsOptional()
  @IsString()
  raisonModification?: string
}
