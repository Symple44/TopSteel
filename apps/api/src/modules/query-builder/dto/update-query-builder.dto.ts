import { PartialType } from '@nestjs/mapped-types'
import { CreateQueryBuilderDto } from './create-query-builder.dto'

export class UpdateQueryBuilderDto extends PartialType(CreateQueryBuilderDto) {}