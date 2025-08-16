import { IsUUID, IsOptional, IsInt, Min, Max, IsString, Length, IsIn, IsNumber, IsArray, ArrayMaxSize } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * DTO pour validation sécurisée des paramètres UUID
 */
export class UUIDParamDto {
  @IsUUID(4, { message: 'ID must be a valid UUID v4' })
  id: string;
}

export class ProductParamsDto {
  @IsUUID(4, { message: 'Product ID must be a valid UUID v4' })
  productId: string;
}

export class CustomerParamsDto {
  @IsUUID(4, { message: 'Customer ID must be a valid UUID v4' })
  customerId: string;
}

export class OrderParamsDto {
  @IsUUID(4, { message: 'Order ID must be a valid UUID v4' })
  orderId: string;
}

/**
 * DTO pour validation sécurisée des paramètres de pagination
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Max(1000, { message: 'Page cannot exceed 1000' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;
}

/**
 * DTO pour validation sécurisée des filtres de produits
 */
export class ProductFiltersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @Length(1, 200, { message: 'Search must be between 1 and 200 characters' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @Length(1, 100, { message: 'Category must be between 1 and 100 characters' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'Brand must be a string' })
  @Length(1, 100, { message: 'Brand must be between 1 and 100 characters' })
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Price min must be a number' })
  @Min(0, { message: 'Price min must be positive' })
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Price max must be a number' })
  @Min(0, { message: 'Price max must be positive' })
  priceMax?: number;

  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  @IsIn(['designation', 'prixVenteHT', 'stockDisponible', 'createdAt', 'updatedAt'], {
    message: 'Sort field must be one of: designation, prixVenteHT, stockDisponible, createdAt, updatedAt'
  })
  sortField?: string = 'createdAt';

  @IsOptional()
  @IsString({ message: 'Sort direction must be a string' })
  @IsIn(['ASC', 'DESC'], { message: 'Sort direction must be ASC or DESC' })
  sortDirection?: string = 'DESC';
}

/**
 * DTO pour validation sécurisée des filtres de clients
 */
export class CustomerFiltersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @Length(1, 200, { message: 'Search must be between 1 and 200 characters' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  hasErpPartner?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

/**
 * DTO pour validation sécurisée des filtres de commandes
 */
export class OrderFiltersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Status must be a string' })
  @Length(1, 50, { message: 'Status must be between 1 and 50 characters' })
  status?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Customer ID must be a valid UUID v4' })
  customerId?: string;

  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  @Length(1, 200, { message: 'Search must be between 1 and 200 characters' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}

/**
 * DTO pour validation des tags (sécurité anti-XSS)
 */
export class TagsDto {
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot have more than 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @Length(1, 50, { each: true, message: 'Each tag must be between 1 and 50 characters' })
  tags: string[];
}