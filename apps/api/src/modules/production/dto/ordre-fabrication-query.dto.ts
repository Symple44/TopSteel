// ordre-fabrication-query.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { BaseQueryDto } from "../../../common/dto/base.dto";

export class OrdreFabricationQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: "EN_COURS" })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projet?: number;
}
