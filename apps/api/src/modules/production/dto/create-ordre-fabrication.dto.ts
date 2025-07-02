import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrdreFabricationStatut, PrioriteProduction } from '../entities/ordre-fabrication.entity';

export class CreateOrdreFabricationDto {
  @IsString()
  numero!: string;

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
