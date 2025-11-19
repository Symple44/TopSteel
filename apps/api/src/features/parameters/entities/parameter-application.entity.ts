import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum ApplicationParameterScope {
  BUSINESS = 'BUSINESS',
  WORKFLOW = 'WORKFLOW',
  PROCESS = 'PROCESS',
  INTEGRATION = 'INTEGRATION',
  REPORTING = 'REPORTING',
  AUTOMATION = 'AUTOMATION',
  VALIDATION = 'VALIDATION',
}

export enum ApplicationParameterType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  ENUM = 'ENUM',
  OBJECT = 'OBJECT',
  FORMULA = 'FORMULA',
  TEMPLATE = 'TEMPLATE',
}

/**
 * Table des paramètres applicatifs métier
 * Stocke toutes les variables métier, configurations business, workflows
 * Exemples : types de projets, statuts de commandes, catégories de produits, etc.
 */
@Entity('parameters_application')
export class ParameterApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_param_app_group')
  group!: string // Ex: 'project_types', 'order_statuses', 'product_categories'

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_param_app_key')
  key!: string // Ex: 'STEEL_STRUCTURE', 'IN_PROGRESS', 'PROFILES'

  @Column({ type: 'text' })
  value!: string // Valeur principale

  @Column({
    type: 'enum',
    enum: ApplicationParameterType,
    default: ApplicationParameterType.STRING,
  })
  type!: ApplicationParameterType

  @Column({
    type: 'enum',
    enum: ApplicationParameterScope,
    default: ApplicationParameterScope.BUSINESS,
  })
  scope!: ApplicationParameterScope

  @Column({ type: 'text', nullable: true })
  description?: string // Description métier

  @Column({ type: 'jsonb', nullable: true })
  businessRules?: {
    validation?: Record<string, unknown> // Règles de validation
    automation?: Record<string, unknown> // Règles d'automatisation
    dependencies?: string[] // Dépendances avec d'autres paramètres
    conditions?: Record<string, unknown> // Conditions d'application
    [key: string]: unknown
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    icon?: string // Icône métier
    color?: string // Couleur associée
    order?: number // Ordre d'affichage
    category?: string // Catégorie métier
    department?: string // Département concerné
    priority?: number // Priorité
    [key: string]: unknown
  }

  @Column({ type: 'jsonb', nullable: true })
  arrayValues?: string[] // Pour les paramètres de type ARRAY

  @Column({ type: 'jsonb', nullable: true })
  objectValues?: Record<string, unknown> // Pour les paramètres de type OBJECT

  @Column({ type: 'text', nullable: true })
  formula?: string // Pour les paramètres de type FORMULA

  @Column({ type: 'text', nullable: true })
  template?: string // Pour les paramètres de type TEMPLATE

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'boolean', default: true })
  isEditable!: boolean // Peut être modifié par les utilisateurs métier

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  defaultLanguage!: string // Langue par défaut

  @Column({ type: 'varchar', nullable: true })
  translationKey?: string // Clé de traduction pour le système i18n (ex: 'projects.types.steel_structure')

  @Column({ type: 'jsonb', nullable: true })
  customTranslations?: Record<string, string> // Overrides personnalisés par langue (optionnel)

  @Column({ type: 'varchar', nullable: true })
  createdBy?: string // Utilisateur créateur

  @Column({ type: 'varchar', nullable: true })
  updatedBy?: string // Dernier utilisateur modifiant

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Index composé pour recherche efficace
  @Index('idx_param_app_group_key', ['group', 'key'])
  static groupKeyIndex: unknown

  @Index('idx_param_app_scope', ['scope'])
  static scopeIndex: unknown
}
