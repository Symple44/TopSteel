import { IsString, IsOptional, IsEmail, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateClientDto {
  @ApiProperty({ description: "Nom du client" })
  @IsString()
  @MaxLength(255)
  nom!: string;

  @ApiPropertyOptional({ description: "Prénom du client" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  prenom?: string;

  @ApiPropertyOptional({ description: "Email du client" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: "Numéro de téléphone" })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telephone?: string;

  @ApiPropertyOptional({ description: "Adresse complète" })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  adresse?: string;

  @ApiPropertyOptional({ description: "Code postal" })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  codePostal?: string;

  @ApiPropertyOptional({ description: "Ville" })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  ville?: string;

  @ApiPropertyOptional({ description: "Numéro SIRET" })
  @IsString()
  @IsOptional()
  @MaxLength(14)
  siret?: string;

  @ApiPropertyOptional({ description: "Notes additionnelles" })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
