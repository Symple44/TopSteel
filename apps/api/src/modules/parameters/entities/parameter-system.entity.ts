import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

export enum ParameterType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  ENUM = 'ENUM',
  OBJECT = 'OBJECT',
}

export enum ParameterScope {
  CORE = 'CORE',
  AUTH = 'AUTH',
  SECURITY = 'SECURITY',
  NOTIFICATION = 'NOTIFICATION',
  SYSTEM = 'SYSTEM',
  DATABASE = 'DATABASE',
  API = 'API',
  UI = 'UI',
}

/**
 * Table des paramètres système
 * Stocke toutes les variables enum, constantes et configurations système
 * Exemples : rôles utilisateurs, statuts, types de données, etc.
 */
@Entity('parameters_system')
export class ParameterSystem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_param_system_group')
  group!: string // Ex: 'user_roles', 'order_status', 'notification_types'

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_param_system_key')
  key!: string // Ex: 'SUPER_ADMIN', 'PENDING', 'EMAIL'

  @Column({ type: 'text' })
  value!: string // Valeur principale

  @Column({
    type: 'enum',
    enum: ParameterType,
    default: ParameterType.STRING,
  })
  type!: ParameterType

  @Column({
    type: 'enum',
    enum: ParameterScope,
    default: ParameterScope.SYSTEM,
  })
  scope!: ParameterScope

  @Column({ type: 'text', nullable: true })
  description?: string // Description technique

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    icon?: string // Icône associée (ex: '👑' pour SUPER_ADMIN)
    color?: string // Couleur associée
    order?: number // Ordre d'affichage
    category?: string // Catégorie supplémentaire
    permissions?: string[] // Permissions associées
    [key: string]: any
  }

  @Column({ type: 'jsonb', nullable: true })
  arrayValues?: string[] // Pour les paramètres de type ARRAY

  @Column({ type: 'jsonb', nullable: true })
  objectValues?: Record<string, any> // Pour les paramètres de type OBJECT

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'boolean', default: false })
  isReadonly!: boolean // Empêche la modification

  @Column({ type: 'varchar', nullable: true })
  translationKey?: string // Clé de traduction pour le système i18n (ex: 'roles.super_admin')

  @Column({ type: 'jsonb', nullable: true })
  customTranslations?: Record<string, string> // Overrides personnalisés par langue (optionnel)

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Index composé pour recherche efficace
  @Index('idx_param_system_group_key', ['group', 'key'])
  static groupKeyIndex: any
}