import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'
import { ArticleStatus, ArticleType } from '../entities/article.entity'

export class CreateArticleDto {
  @ApiProperty({ description: "Référence unique de l'article", maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  reference!: string

  @ApiProperty({ description: "Désignation de l'article", maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  designation!: string

  @ApiPropertyOptional({ description: 'Description détaillée', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string

  @ApiProperty({ description: "Type d'article", enum: ArticleType })
  @IsEnum(ArticleType)
  type!: ArticleType

  @ApiProperty({ description: "Statut de l'article", enum: ArticleStatus })
  @IsEnum(ArticleStatus)
  status!: ArticleStatus

  @ApiPropertyOptional({ description: "Famille d'article", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  famille?: string

  @ApiPropertyOptional({ description: "Sous-famille d'article", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sousFamille?: string

  @ApiPropertyOptional({ description: 'Marque', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  marque?: string

  @ApiPropertyOptional({ description: 'Modèle', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modele?: string

  @ApiProperty({ description: 'Unité de stock', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  uniteStock!: string

  @ApiPropertyOptional({ description: "Unité d'achat", maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  uniteAchat?: string

  @ApiPropertyOptional({ description: 'Unité de vente', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  uniteVente?: string

  @ApiProperty({ description: "Coefficient d'achat", minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  coefficientAchat!: number

  @ApiProperty({ description: 'Coefficient de vente', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  coefficientVente!: number

  @ApiProperty({ description: 'Article géré en stock' })
  @IsBoolean()
  gereEnStock!: boolean

  @ApiPropertyOptional({ description: 'Stock physique', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  stockPhysique?: number

  @ApiPropertyOptional({ description: 'Stock minimum', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  stockMini?: number

  @ApiPropertyOptional({ description: 'Stock maximum', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  stockMaxi?: number

  @ApiPropertyOptional({ description: 'Stock de sécurité', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  stockSecurite?: number

  @ApiProperty({ description: 'Méthode de valorisation', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  methodeValorisation!: string

  @ApiPropertyOptional({ description: "Prix d'achat standard", minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  prixAchatStandard?: number

  @ApiPropertyOptional({ description: 'Prix de vente HT', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  prixVenteHT?: number

  @ApiPropertyOptional({ description: 'Taux TVA (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  tauxTVA?: number

  @ApiPropertyOptional({ description: 'Taux de marge (%)', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  tauxMarge?: number

  @ApiPropertyOptional({ description: "Délai d'approvisionnement en jours", minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  delaiApprovisionnement?: number

  @ApiPropertyOptional({ description: 'Quantité minimum de commande', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  quantiteMiniCommande?: number

  @ApiPropertyOptional({ description: 'Poids en kg', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  poids?: number

  @ApiPropertyOptional({ description: 'Longueur en mm', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  longueur?: number

  @ApiPropertyOptional({ description: 'Largeur en mm', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  largeur?: number

  @ApiPropertyOptional({ description: 'Hauteur en mm', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  hauteur?: number

  @ApiPropertyOptional({ description: 'Couleur', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couleur?: string
}
