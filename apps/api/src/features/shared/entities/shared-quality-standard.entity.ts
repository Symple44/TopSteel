import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../core/database/entities/base/multi-tenant.entity'

export enum QualityStandardType {
  ISO = 'ISO',
  EN = 'EN', // Norme européenne
  NF = 'NF', // Norme française
  DIN = 'DIN', // Norme allemande
  ASTM = 'ASTM', // Norme américaine
  INTERNE = 'INTERNE', // Standard interne
  CLIENT = 'CLIENT', // Standard client
  AUTRE = 'AUTRE',
}

export enum QualityDomain {
  DIMENSIONNEL = 'DIMENSIONNEL',
  ASPECT = 'ASPECT',
  MECANIQUE = 'MECANIQUE',
  CHIMIQUE = 'CHIMIQUE',
  FONCTIONNEL = 'FONCTIONNEL',
  ENVIRONNEMENTAL = 'ENVIRONNEMENTAL',
  SECURITE = 'SECURITE',
}

/**
 * Standards qualité partagés entre sociétés
 * Stocké dans la base SHARED
 */
@Entity('shared_quality_standards')
@Index(['code', 'type'])
export class SharedQualityStandard extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string // Code unique du standard

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: QualityStandardType,
  })
  @Index()
  type!: QualityStandardType

  @Column({
    type: 'enum',
    enum: QualityDomain,
    array: true,
  })
  domaines!: QualityDomain[]

  @Column({ type: 'varchar', length: 50, nullable: true })
  versionStandard?: string

  @Column({ type: 'date', nullable: true })
  datePublication?: Date

  @Column({ type: 'date', nullable: true })
  dateApplication?: Date

  // Critères de contrôle
  @Column({ type: 'jsonb', default: [] })
  criteres!: Array<{
    code: string
    nom: string
    description?: string
    domaine: QualityDomain
    type: 'MESURE' | 'VISUEL' | 'FONCTIONNEL' | 'DESTRUCTIF'
    obligatoire: boolean
    parametre?: {
      unite?: string
      valeurMin?: number
      valeurMax?: number
      valeurCible?: number
      tolerance?: string
      methodeCalcul?: string
    }
    frequenceControle?: {
      type: 'UNITAIRE' | 'ECHANTILLONNAGE' | 'LOT'
      valeur?: number
      unite?: string
    }
  }>

  // Méthodes de contrôle
  @Column({ type: 'jsonb', default: {} })
  methodesControle!: {
    equipements?: Array<{
      type: string
      precision?: string
      etalonnage?: string
    }>
    procedures?: Array<{
      nom: string
      etapes: string[]
      duree?: number
    }>
    competences?: string[]
  }

  // Plans d'échantillonnage
  @Column({ type: 'jsonb', default: {} })
  echantillonnage!: {
    type?: 'AQL' | 'ISO2859' | 'ISO3951' | 'CUSTOM'
    niveaux?: Array<{
      taillelot: { min: number; max: number }
      tailleEchantillon: number
      acceptation: number
      rejet: number
    }>
    reglesSpeciales?: string[]
  }

  // Défauts et classifications
  @Column({ type: 'jsonb', default: [] })
  defauts!: Array<{
    code: string
    nom: string
    description?: string
    gravite: 'CRITIQUE' | 'MAJEUR' | 'MINEUR'
    domaine: QualityDomain
    critereDetection?: string
    actionCorrective?: string
  }>

  // Documents et références
  @Column({ type: 'jsonb', default: {} })
  references!: {
    normesLiees?: string[]
    documentsTechniques?: Array<{
      nom: string
      type: string
      reference?: string
    }>
    formulaires?: string[]
  }

  // Applications
  @Column({ type: 'jsonb', default: {} })
  applications!: {
    typeProduits?: string[]
    materiaux?: string[]
    processus?: string[]
    secteurs?: string[]
  }

  // Certifications associées
  @Column({ type: 'simple-array', nullable: true })
  certifications?: string[]

  // Historique des révisions
  @Column({ type: 'jsonb', default: [] })
  revisions!: Array<{
    versionStandard: string
    date: Date
    modifications: string[]
    auteur?: string
  }>

  // Métadonnées
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>
}
