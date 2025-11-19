import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum ClientParameterScope {
  PREFERENCE = 'PREFERENCE',
  CONFIGURATION = 'CONFIGURATION',
  CUSTOMIZATION = 'CUSTOMIZATION',
  WORKFLOW = 'WORKFLOW',
  DISPLAY = 'DISPLAY',
  BEHAVIOR = 'BEHAVIOR',
  INTEGRATION = 'INTEGRATION',
}

export enum ClientParameterType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  ENUM = 'ENUM',
  OBJECT = 'OBJECT',
  COLOR = 'COLOR',
  FILE = 'FILE',
  URL = 'URL',
}

export enum ClientParameterAccess {
  READ_ONLY = 'READ_ONLY', // Client peut voir mais pas modifier
  USER_EDITABLE = 'USER_EDITABLE', // Utilisateur client peut modifier
  ADMIN_ONLY = 'ADMIN_ONLY', // Seul admin client peut modifier
  SYSTEM_MANAGED = 'SYSTEM_MANAGED', // Géré automatiquement par le système
}

/**
 * Table des paramètres clients
 * Stocke toutes les préférences, configurations et personnalisations spécifiques aux clients
 * Exemples : couleurs de thème, logos, préférences d'affichage, configurations spécifiques
 */
@Entity('parameters_client')
export class ParameterClient {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index('idx_param_client_tenant')
  tenantId!: string // ID de la société/tenant

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_param_client_group')
  group!: string // Ex: 'theme', 'branding', 'user_preferences', 'workflow_config'

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_param_client_key')
  key!: string // Ex: 'primary_color', 'company_logo', 'default_view', 'auto_save'

  @Column({ type: 'text' })
  value!: string // Valeur principale

  @Column({
    type: 'enum',
    enum: ClientParameterType,
    default: ClientParameterType.STRING,
  })
  type!: ClientParameterType

  @Column({
    type: 'enum',
    enum: ClientParameterScope,
    default: ClientParameterScope.PREFERENCE,
  })
  scope!: ClientParameterScope

  @Column({
    type: 'enum',
    enum: ClientParameterAccess,
    default: ClientParameterAccess.USER_EDITABLE,
  })
  access!: ClientParameterAccess

  @Column({ type: 'text', nullable: true })
  description?: string // Description pour l'utilisateur

  @Column({ type: 'jsonb', nullable: true })
  constraints?: {
    minValue?: number // Pour les nombres
    maxValue?: number
    minLength?: number // Pour les chaînes
    maxLength?: number
    pattern?: string // Regex de validation
    allowedValues?: string[] // Valeurs autorisées
    fileTypes?: string[] // Types de fichiers autorisés
    maxFileSize?: number // Taille max de fichier
    [key: string]: unknown
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    icon?: string // Icône d'affichage
    category?: string // Catégorie d'affichage
    order?: number // Ordre d'affichage
    helpText?: string // Texte d'aide
    placeholder?: string // Placeholder pour les champs
    section?: string // Section dans l'interface
    [key: string]: unknown
  }

  @Column({ type: 'jsonb', nullable: true })
  arrayValues?: string[] // Pour les paramètres de type ARRAY

  @Column({ type: 'jsonb', nullable: true })
  objectValues?: Record<string, unknown> // Pour les paramètres de type OBJECT

  @Column({ type: 'text', nullable: true })
  defaultValue?: string // Valeur par défaut

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean // Visible dans l'interface utilisateur

  @Column({ type: 'varchar', length: 10, default: 'fr' })
  defaultLanguage!: string // Langue par défaut

  @Column({ type: 'varchar', nullable: true })
  translationKey?: string // Clé de traduction pour le système i18n (ex: 'preferences.theme.primary_color')

  @Column({ type: 'jsonb', nullable: true })
  customTranslations?: Record<string, string> // Overrides personnalisés par langue (optionnel)

  @Column({ type: 'uuid', nullable: true })
  userId?: string // Utilisateur spécifique (pour les préférences utilisateur)

  @Column({ type: 'varchar', nullable: true })
  createdBy?: string // Utilisateur créateur

  @Column({ type: 'varchar', nullable: true })
  updatedBy?: string // Dernier utilisateur modifiant

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Index composé pour recherche efficace
  @Index('idx_param_client_tenant_group_key', ['tenantId', 'group', 'key'])
  static tenantGroupKeyIndex: unknown

  @Index('idx_param_client_user', ['userId'])
  static userIndex: unknown

  @Index('idx_param_client_scope', ['scope'])
  static scopeIndex: unknown
}
