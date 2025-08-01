import { Type } from 'class-transformer'
import { IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator'

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
