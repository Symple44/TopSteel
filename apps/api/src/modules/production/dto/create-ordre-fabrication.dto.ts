// create-ordre-fabrication.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateOrdreFabricationDto {
  @ApiProperty({ example: "OF-2025-001" })
  @IsString()
  numero!: string;

  @ApiProperty({ example: "EN_ATTENTE" })
  @IsString()
  statut!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  projet?: number;
}
