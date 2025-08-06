import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum ModuleCategory {
  CORE = 'CORE',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN',
  REPORTS = 'REPORTS',
}

@Entity('modules')
@Index(['name'], { unique: true })
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string

  @Column({ type: 'text' })
  description!: string

  @Column({ type: 'enum', enum: ModuleCategory, default: ModuleCategory.BUSINESS })
  @Index()
  category!: ModuleCategory

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string

  @Column({ type: 'uuid', nullable: true })
  parentModuleId?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relations
  // Note: Permission.module relation removed as modules table doesn't exist in auth DB

  // Méthodes utilitaires
  static createSystemModule(
    name: string,
    description: string,
    category: ModuleCategory,
    icon?: string
  ): Module {
    const module = new Module()
    module.name = name
    module.description = description
    module.category = category
    module.icon = icon
    module.isActive = true
    return module
  }
}
