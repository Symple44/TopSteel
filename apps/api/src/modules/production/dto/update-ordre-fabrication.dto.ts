// update-ordre-fabrication.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateOrdreFabricationDto } from './create-ordre-fabrication.dto';

export class UpdateOrdreFabricationDto extends PartialType(CreateOrdreFabricationDto) {}