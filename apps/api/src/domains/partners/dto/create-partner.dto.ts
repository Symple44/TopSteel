import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'
import { PartnerCategory, PartnerStatus, PartnerType } from '../entities/partner.entity'

/**
 * DTO pour la création d'un partenaire
 */
export class CreatePartnerDto {
  @ApiPropertyOptional({
    description: 'Code unique du partenaire (généré automatiquement si non fourni)',
    example: 'CLI-000001',
  })
  @IsOptional()
  @IsString()
  code?: string

  @ApiProperty({
    description: 'Type de partenaire',
    enum: PartnerType,
    example: PartnerType.CLIENT,
  })
  @IsEnum(PartnerType)
  type!: PartnerType

  @ApiPropertyOptional({
    description: 'Statut du partenaire',
    enum: PartnerStatus,
    default: PartnerStatus.ACTIF,
  })
  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus

  @ApiProperty({
    description: 'Dénomination sociale ou nom',
    example: 'ACME Corporation',
  })
  @IsNotEmpty()
  @IsString()
  denomination!: string

  @ApiPropertyOptional({
    description: 'Nom commercial',
    example: 'ACME Shop',
  })
  @IsOptional()
  @IsString()
  nomCommercial?: string

  @ApiPropertyOptional({
    description: 'Forme juridique',
    example: 'SAS',
  })
  @IsOptional()
  @IsString()
  formeJuridique?: string

  @ApiPropertyOptional({
    description: 'Numéro SIRET',
    example: '12345678901234',
  })
  @IsOptional()
  @IsString()
  siret?: string

  @ApiPropertyOptional({
    description: 'Numéro SIREN',
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  siren?: string

  @ApiPropertyOptional({
    description: 'Code APE/NAF',
    example: '4661Z',
  })
  @IsOptional()
  @IsString()
  codeAPE?: string

  @ApiPropertyOptional({
    description: 'Numéro de TVA intracommunautaire',
    example: 'FR12345678901',
  })
  @IsOptional()
  @IsString()
  numeroTVA?: string

  @ApiPropertyOptional({
    description: 'Adresse principale',
    example: '123 Rue de la Paix',
  })
  @IsOptional()
  @IsString()
  adresse?: string

  @ApiPropertyOptional({
    description: "Complément d'adresse",
    example: 'Bâtiment A, 2ème étage',
  })
  @IsOptional()
  @IsString()
  adresseComplement?: string

  @ApiPropertyOptional({
    description: 'Code postal',
    example: '75001',
  })
  @IsOptional()
  @IsString()
  codePostal?: string

  @ApiPropertyOptional({
    description: 'Ville',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  ville?: string

  @ApiPropertyOptional({
    description: 'Région',
    example: 'Île-de-France',
  })
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional({
    description: 'Pays',
    example: 'France',
    default: 'France',
  })
  @IsOptional()
  @IsString()
  pays?: string

  @ApiPropertyOptional({
    description: 'Téléphone principal',
    example: '+33 1 23 45 67 89',
  })
  @IsOptional()
  @IsString()
  telephone?: string

  @ApiPropertyOptional({
    description: 'Téléphone mobile',
    example: '+33 6 12 34 56 78',
  })
  @IsOptional()
  @IsString()
  mobile?: string

  @ApiPropertyOptional({
    description: 'Numéro de fax',
    example: '+33 1 23 45 67 90',
  })
  @IsOptional()
  @IsString()
  fax?: string

  @ApiPropertyOptional({
    description: 'Adresse email principale',
    example: 'contact@acme-corp.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    description: 'Site web',
    example: 'https://www.acme-corp.com',
  })
  @IsOptional()
  @IsString()
  siteWeb?: string

  @ApiPropertyOptional({
    description: 'Catégorie du partenaire',
    enum: PartnerCategory,
    example: PartnerCategory.ENTREPRISE,
  })
  @IsOptional()
  @IsEnum(PartnerCategory)
  categorie?: PartnerCategory

  @ApiPropertyOptional({
    description: "Secteur d'activité",
    example: 'Métallurgie',
  })
  @IsOptional()
  @IsString()
  secteurActivite?: string

  @ApiPropertyOptional({
    description: 'Effectif approximatif',
    example: 50,
  })
  @IsOptional()
  effectif?: number

  @ApiPropertyOptional({
    description: "Chiffre d'affaires annuel",
    example: 2500000.0,
  })
  @IsOptional()
  chiffreAffaires?: number

  @ApiPropertyOptional({
    description: 'Contact principal - Civilité',
    example: 'M.',
  })
  @IsOptional()
  @IsString()
  contactCivilite?: string

  @ApiPropertyOptional({
    description: 'Contact principal - Nom',
    example: 'Dupont',
  })
  @IsOptional()
  @IsString()
  contactNom?: string

  @ApiPropertyOptional({
    description: 'Contact principal - Prénom',
    example: 'Jean',
  })
  @IsOptional()
  @IsString()
  contactPrenom?: string

  @ApiPropertyOptional({
    description: 'Contact principal - Fonction',
    example: 'Directeur Commercial',
  })
  @IsOptional()
  @IsString()
  contactFonction?: string

  @ApiPropertyOptional({
    description: 'Contact principal - Email',
    example: 'j.dupont@acme-corp.com',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @ApiPropertyOptional({
    description: 'Contact principal - Téléphone',
    example: '+33 1 23 45 67 89',
  })
  @IsOptional()
  @IsString()
  contactTelephone?: string

  @ApiPropertyOptional({
    description: 'Partenaire préféré',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  prefere?: boolean

  @ApiPropertyOptional({
    description: 'Partenaire actif',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  actif?: boolean

  @ApiPropertyOptional({
    description: 'Notes et commentaires',
    example: { commentaires: 'Client très fiable, paiement rapide' },
  })
  @IsOptional()
  @IsObject()
  notes?: {
    commentaires?: string
    historiqueNotes?: Array<{
      date: string
      auteur: string
      contenu: string
    }>
    tagsPersonnalises?: string[]
  }

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    type: 'object',
    additionalProperties: true,
    example: {
      sourceProspection: 'Site web',
      commercial: 'Pierre Martin',
    },
  })
  @IsOptional()
  @IsObject()
  metadonnees?: Record<string, unknown>
}
