import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class CreateQueryBuilderColumnDto {
  @IsString()
  tableName: string

  @IsString()
  columnName: string

  @IsString()
  alias: string

  @IsString()
  label: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  dataType: string

  @IsBoolean()
  isPrimaryKey: boolean

  @IsBoolean()
  isForeignKey: boolean

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean = true

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean = true

  @IsOptional()
  @IsBoolean()
  isSortable?: boolean = true

  @IsOptional()
  @IsBoolean()
  isGroupable?: boolean = false

  @IsNumber()
  displayOrder: number

  @IsOptional()
  @IsNumber()
  width?: number

  @IsOptional()
  @IsObject()
  format?: unknown

  @IsOptional()
  @IsObject()
  aggregation?: unknown
}

export class CreateQueryBuilderJoinDto {
  @IsString()
  fromTable: string

  @IsString()
  fromColumn: string

  @IsString()
  toTable: string

  @IsString()
  toColumn: string

  @IsString()
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

  @IsString()
  alias: string

  @IsNumber()
  order: number
}

export class CreateQueryBuilderCalculatedFieldDto {
  @IsString()
  name: string

  @IsString()
  label: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  expression: string

  @IsString()
  dataType: string

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean = true

  @IsNumber()
  displayOrder: number

  @IsOptional()
  @IsObject()
  format?: unknown

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[]
}

export class CreateQueryBuilderDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  database: string

  @IsString()
  mainTable: string

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false

  @IsOptional()
  @IsNumber()
  maxRows?: number

  @IsOptional()
  @IsObject()
  settings?: {
    enablePagination?: boolean
    pageSize?: number
    enableSorting?: boolean
    enableFiltering?: boolean
    enableExport?: boolean
    exportFormats?: string[]
  }

  @IsOptional()
  @IsObject()
  layout?: unknown

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQueryBuilderColumnDto)
  columns?: CreateQueryBuilderColumnDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQueryBuilderJoinDto)
  joins?: CreateQueryBuilderJoinDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQueryBuilderCalculatedFieldDto)
  calculatedFields?: CreateQueryBuilderCalculatedFieldDto[]
}
