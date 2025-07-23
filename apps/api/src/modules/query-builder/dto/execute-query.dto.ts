import { IsOptional, IsNumber, IsString, IsObject, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

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
  @IsString()
  sortBy?: string

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC'

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>
}