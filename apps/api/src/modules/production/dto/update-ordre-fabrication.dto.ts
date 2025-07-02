import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrdreFabricationStatut, PrioriteProduction } from '../entities/ordre-fabrication.entity';
import { CreateOrdreFabricationDto } from './create-ordre-fabrication.dto';

export class UpdateOrdreFabricationDto extends PartialType(CreateOrdreFabricationDto) {
  @IsOptional()
  @IsString()
  numero?: string;

  @IsOptional()
  @IsEnum(OrdreFabricationStatut)
  statut?: OrdreFabricationStatut;

  @IsOptional()
  @IsInt()
  projet?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PrioriteProduction)
  priorite?: PrioriteProduction;

  @IsOptional()
  @IsDateString()
  dateDebutPrevue?: string;

  @IsOptional()
  @IsDateString()
  dateFinPrevue?: string;

  @IsOptional()
  @IsDateString()
  dateDebutReelle?: string;

  @IsOptional()
  @IsDateString()
  dateFinReelle?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  avancement?: number;

  @IsOptional()
  @IsInt()
  responsableId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
