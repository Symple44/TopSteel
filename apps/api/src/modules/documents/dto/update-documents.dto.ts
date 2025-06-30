import { PartialType } from '@nestjs/swagger';
import { CreateDocumentsDto } from './create-documents.dto';

export class UpdateDocumentsDto extends PartialType(CreateDocumentsDto) {}
