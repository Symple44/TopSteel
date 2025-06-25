import { PartialType } from '@nestjs/swagger';
import { CreateFournisseurDto } from './create-fournisseur.dto';

export class UpdateFournisseurDto extends PartialType(CreateFournisseurDto) {}
