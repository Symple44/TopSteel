import { PartialType } from '@nestjs/swagger'
import { CreateMateriauxDto } from './create-materiaux.dto'

export class UpdateMateriauxDto extends PartialType(CreateMateriauxDto) {}
