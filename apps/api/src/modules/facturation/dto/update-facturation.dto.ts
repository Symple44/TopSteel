import { PartialType } from '@nestjs/swagger';
import { CreateFacturationDto } from './create-facturation.dto';

export class UpdateFacturationDto extends PartialType(CreateFacturationDto) {}
