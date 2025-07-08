// update-commande.dto.ts
import { PartialType } from '@nestjs/swagger'
import { CreateCommandeDto } from './create-commande.dto'

export class UpdateCommandeDto extends PartialType(CreateCommandeDto) {}
