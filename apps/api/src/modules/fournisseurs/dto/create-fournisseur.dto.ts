import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFournisseurDto {
  @ApiProperty({ description: "Nom du fournisseur" })
  @IsString()
  @MaxLength(255)
  nom!: string;

  @ApiPropertyOptional({ description: "Email de contact" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Numero de telephone" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiPropertyOptional({ description: "Adresse complete" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  adresse?: string;

  @ApiPropertyOptional({ description: "Numero SIRET" })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  siret?: string;
}
