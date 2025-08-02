import { PartialType } from '@nestjs/mapped-types'
import { CreatePageTemplateDto } from './create-page-template.dto'

export class UpdatePageTemplateDto extends PartialType(CreatePageTemplateDto) {}