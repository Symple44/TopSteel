import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

// JsonValue type definition for query builder DTOs
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

/**
 * Valid sort directions
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Valid filter operators
 */
export enum FilterOperator {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUALS = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUALS = '<=',
  LIKE = 'LIKE',
  ILIKE = 'ILIKE',
  IN = 'IN',
  NOT_IN = 'NOT IN',
  IS_NULL = 'IS NULL',
  IS_NOT_NULL = 'IS NOT NULL',
  BETWEEN = 'BETWEEN',
}

/**
 * Column selection DTO with security validation
 */
export class SelectColumnDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Table name can only contain alphanumeric characters and underscores',
  })
  tableName: string

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Column name can only contain alphanumeric characters and underscores',
  })
  columnName: string

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Alias can only contain alphanumeric characters and underscores',
  })
  alias?: string

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Table alias can only contain alphanumeric characters and underscores',
  })
  tableAlias?: string
}

/**
 * Filter condition DTO with strict validation
 */
export class FilterConditionDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Table name can only contain alphanumeric characters and underscores',
  })
  tableName: string

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Column name can only contain alphanumeric characters and underscores',
  })
  columnName: string

  @IsEnum(FilterOperator)
  operator: FilterOperator

  // Value can be string, number, boolean, array, or null
  value: JsonValue

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Table alias can only contain alphanumeric characters and underscores',
  })
  tableAlias?: string
}

/**
 * Sort condition DTO with validation
 */
export class SortConditionDto {
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Table name can only contain alphanumeric characters and underscores',
  })
  tableName: string

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Column name can only contain alphanumeric characters and underscores',
  })
  columnName: string

  @IsEnum(SortDirection)
  direction: SortDirection

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Table alias can only contain alphanumeric characters and underscores',
  })
  tableAlias?: string
}

/**
 * Join condition DTO with security validation
 */
export class JoinConditionDto {
  @IsString()
  @IsIn(['INNER', 'LEFT', 'RIGHT'], { message: 'Join type must be INNER, LEFT, or RIGHT' })
  type: 'INNER' | 'LEFT' | 'RIGHT'

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'From table name can only contain alphanumeric characters and underscores',
  })
  fromTable: string

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'From column name can only contain alphanumeric characters and underscores',
  })
  fromColumn: string

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'To table name can only contain alphanumeric characters and underscores',
  })
  toTable: string

  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'To column name can only contain alphanumeric characters and underscores',
  })
  toColumn: string

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'From alias can only contain alphanumeric characters and underscores',
  })
  fromAlias?: string

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'To alias can only contain alphanumeric characters and underscores',
  })
  toAlias?: string
}

/**
 * Enhanced Execute Query DTO with comprehensive security validation
 */
export class ExecuteQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  pageSize?: number = 50

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectColumnDto)
  selectColumns?: SelectColumnDto[]

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'From table can only contain alphanumeric characters and underscores',
  })
  fromTable?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JoinConditionDto)
  joins?: JoinConditionDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  filters?: FilterConditionDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortConditionDto)
  sorts?: SortConditionDto[]

  // Legacy support - deprecated, use filters array instead
  @IsOptional()
  @IsObject()
  @Transform(({ value: _value }) => {
    // If legacy filters are provided, they should be empty or null
    // Force users to use the new structured format
    return null
  })
  legacyFilters?: null

  // Legacy support - deprecated, use sorts array instead
  @IsOptional()
  @IsString()
  @Transform(({ value: _value }) => null) // Force null to prevent usage
  sortBy?: null

  @IsOptional()
  @IsEnum(SortDirection)
  @Transform(({ value: _value }) => null) // Force null to prevent usage
  sortOrder?: null
}

/**
 * Raw SQL execution DTO (for development/admin use only)
 */
export class ExecuteRawSqlDto {
  @IsString()
  @Length(1, 10000)
  sql: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100

  @IsOptional()
  @IsString()
  @Length(36, 36) // UUID length
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'Company ID must be a valid UUID',
  })
  companyId?: string
}
