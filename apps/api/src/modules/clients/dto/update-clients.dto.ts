import { PartialType } from '@nestjs/swagger';
import { CreateClientsDto } from './create-clients.dto';

export class UpdateClientsDto extends PartialType(CreateClientsDto) {}
