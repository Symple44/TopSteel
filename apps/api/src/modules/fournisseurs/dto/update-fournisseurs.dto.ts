import { PartialType } from '@nestjs/swagger';
import { CreateFournisseursDto } from './create-fournisseurs.dto';

export class UpdateFournisseursDto extends PartialType(CreateFournisseursDto) {}
