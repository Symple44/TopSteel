import { PartialType } from '@nestjs/swagger'
import { CreateMachinesDto } from './create-machines.dto'

export class UpdateMachinesDto extends PartialType(CreateMachinesDto) {}
