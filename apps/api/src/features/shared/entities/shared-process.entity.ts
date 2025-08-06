import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../core/database/entities/base/multi-tenant.entity'

export enum ProcessType {
  DECOUPE = 'DECOUPE',
  PLIAGE = 'PLIAGE',
  SOUDAGE = 'SOUDAGE',
  USINAGE = 'USINAGE',
  PERCAGE = 'PERCAGE',
  ASSEMBLAGE = 'ASSEMBLAGE',
  TRAITEMENT = 'TRAITEMENT',
  FINITION = 'FINITION',
  CONTROLE = 'CONTROLE',
  AUTRE = 'AUTRE',
}

export enum ProcessComplexity {
  SIMPLE = 'SIMPLE',
  MOYEN = 'MOYEN',
  COMPLEXE = 'COMPLEXE',
  EXPERT = 'EXPERT',
}

/**
 * Processus de fabrication standards partagés
 * Stocké dans la base SHARED
 */
@Entity('shared_processes')
@Index(['code', 'type'])
export class SharedProcess extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string // Code unique du processus

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: ProcessType,
  })
  @Index()
  type!: ProcessType

  @Column({
    type: 'enum',
    enum: ProcessComplexity,
    default: ProcessComplexity.MOYEN,
  })
  complexite!: ProcessComplexity

  // Étapes du processus
  @Column({ type: 'jsonb', default: [] })
  etapes!: Array<{
    ordre: number
    nom: string
    description?: string
    dureeEstimee?: number // minutes
    competencesRequises?: string[]
    outilsNecessaires?: string[]
    parametres?: Record<string, unknown>
    controleQualite?: {
      type: string
      criteres: string[]
      tolerances?: Record<string, unknown>
    }
  }>

  // Machines et équipements types
  @Column({ type: 'jsonb', default: {} })
  equipements!: {
    machines?: string[] // Types de machines
    outils?: string[] // Outils nécessaires
    consommables?: string[] // Consommables
    epi?: string[] // Équipements de protection
  }

  // Paramètres standards
  @Column({ type: 'jsonb', default: {} })
  parametresStandards!: {
    [key: string]: {
      nom: string
      unite?: string
      valeurMin?: number
      valeurMax?: number
      valeurDefaut?: number
      description?: string
    }
  }

  // Matériaux compatibles
  @Column({ type: 'jsonb', default: {} })
  materiauxCompatibles!: {
    types?: string[] // Types de matériaux
    formes?: string[] // Formes compatibles
    epaisseurMin?: number // mm
    epaisseurMax?: number // mm
    restrictions?: string[]
  }

  // Normes et standards
  @Column({ type: 'jsonb', default: {} })
  normes!: {
    fabrication?: string[]
    qualite?: string[]
    securite?: string[]
    environnement?: string[]
  }

  // Risques et sécurité
  @Column({ type: 'jsonb', default: {} })
  securite!: {
    risques?: Array<{
      type: string
      niveau: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE'
      description: string
      preventions: string[]
    }>
    formations?: string[]
    habilitations?: string[]
  }

  // Données de performance moyennes
  @Column({ type: 'jsonb', default: {} })
  performances!: {
    cadenceHoraire?: number
    tauxRebut?: number // %
    consommationEnergie?: number // kWh
    coutMoyenMinute?: number
  }

  // Documentation associée
  @Column({ type: 'jsonb', nullable: true })
  documentation?: {
    modeOperatoire?: string // URL ou référence
    ficheTechnique?: string
    videos?: string[]
    schemas?: string[]
  }

  // Applications et exemples
  @Column({ type: 'simple-array', nullable: true })
  applications?: string[]

  @Column({ type: 'jsonb', nullable: true })
  exemplesProduction?: Array<{
    nom: string
    description?: string
    materiaux?: string
    temps?: number
    difficulte?: string
  }>

  // Métadonnées
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>
}
