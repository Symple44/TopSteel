import { PartialType } from '@nestjs/swagger'
import { CreateProjetsDto } from './create-projets.dto'

export class UpdateProjetsDto extends PartialType(CreateProjetsDto) {}
