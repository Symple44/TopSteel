import { IsOptional, IsString, IsNumber, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class ProjetQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  statut?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clientId?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFin?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  montantMin?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  montantMax?: number;
}
