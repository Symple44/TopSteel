import { PartialType } from '@nestjs/swagger';
import { CreateProjetDto } from './create-projet.dto';

export class UpdateProjetDto extends PartialType(CreateProjetDto) {}
