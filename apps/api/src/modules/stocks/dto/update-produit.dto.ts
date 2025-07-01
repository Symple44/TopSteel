// update-produit.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProduitDto } from './create-produit.dto';

export class UpdateProduitDto extends PartialType(CreateProduitDto) {}