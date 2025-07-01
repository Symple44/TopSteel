import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base.dto';
import { ProjetStatut } from '../entities/projet.entity';

export class ProjetsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: ProjetStatut })
  @IsOptional()
  @IsEnum(ProjetStatut)
  statut?: ProjetStatut;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  clientId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  responsableId?: number;
}