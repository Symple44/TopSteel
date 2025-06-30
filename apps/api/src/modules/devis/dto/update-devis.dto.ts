import { PartialType } from '@nestjs/swagger';
import { CreateDevisDto } from './create-devis.dto';

export class UpdateDevisDto extends PartialType(CreateDevisDto) {}
