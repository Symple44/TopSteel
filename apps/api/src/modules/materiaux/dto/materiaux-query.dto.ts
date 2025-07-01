import { IsOptional, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BaseQueryDto } from "../../../common/dto/base.dto";

export class MateriauxQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  actif?: boolean;
}
