// apps/api/src/modules/fournisseurs/dto/create-fournisseur.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class AdresseDto {
  @ApiProperty()
  @IsString()
  rue: string;

  @ApiProperty()
  @IsString()
  codePostal: string;

  @ApiProperty()
  @IsString()
  ville: string;

  @ApiProperty({ default: 'France' })
  @IsString()
  pays: string = 'France';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complement?: string;
}

class ContactDto {
  @ApiProperty()
  @IsString()
  nom: string;

  @ApiProperty()
  @IsString()
  prenom: string;

  @ApiProperty()
  @IsString()
  fonction: string;

  @ApiProperty()
  @IsString()
  telephone: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class CreateFournisseurDto {
  @ApiProperty({ example: 'Acier Plus SARL' })
  @IsString()
  nom: string;

  @ApiProperty({ example: '12345678901234' })
  @IsString()
  siret: string;

  @ApiPropertyOptional({ example: 'FR12345678901' })
  @IsOptional()
  @IsString()
  tvaIntra?: string;

  @ApiProperty({ example: 'contact@acierplus.fr' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  telephone: string;

  @ApiProperty({ type: AdresseDto })
  @ValidateNested()
  @Type(() => AdresseDto)
  adresse: AdresseDto;

  @ApiPropertyOptional({ example: 'https://www.acierplus.fr' })
  @IsOptional()
  @IsString()
  siteWeb?: string;

  @ApiPropertyOptional({ type: [ContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts?: ContactDto[];

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  delaiPaiement?: number;

  @ApiPropertyOptional({ example: '30 jours fin de mois' })
  @IsOptional()
  @IsString()
  conditionsPaiement?: string;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  delaiLivraison?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  franco?: number;

  @ApiPropertyOptional({ example: ['PROFILE', 'TOLE', 'TUBE'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}