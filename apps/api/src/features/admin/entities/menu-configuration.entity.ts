import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// Circular dependency resolved - using string reference
// import { MenuItem } from './menu-item.entity'

// Interface for MenuItem to avoid circular dependency
interface MenuItemData {
  id: string
  configId: string
  parentId?: string
  title: string
  orderIndex: number
  isVisible: boolean
  type: string
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  metadata?: Record<string, unknown>
  // Virtual properties for compatibility
  titleKey?: string
  href?: string
  icon?: string
  gradient?: string
  badge?: string
  moduleId?: string
  target?: string
}

@Entity('menu_configurations')
@Index(['name'], { unique: true }) // Unique index for name lookups
@Index(['isActive', 'isSystem']) // For filtering active/system configurations
@Index(['createdBy']) // For audit queries
@Index(['createdAt']) // For chronological queries
export class MenuConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'boolean', default: false, name: 'isactive' })
  @Index()
  isActive!: boolean

  @Column({ type: 'boolean', default: false, name: 'issystem' })
  @Index()
  isSystem!: boolean

  @Column({ type: 'json', nullable: true })
  @Index() // GIN index for metadata queries
  metadata?: Record<string, unknown>

  @CreateDateColumn({ name: 'createdat' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true, name: 'createdby' })
  @Index() // Index for audit queries
  createdBy?: string

  @Column({ type: 'uuid', nullable: true, name: 'updatedby' })
  @Index() // Index for audit queries
  updatedBy?: string

  // Relations
  @OneToMany('MenuItem', 'configuration', { lazy: true })
  items!: MenuItemData[]

  // Méthodes utilitaires
  static createSystem(name: string, description: string): MenuConfiguration {
    const config = new MenuConfiguration()
    config.name = name
    config.description = description
    config.isSystem = true
    config.isActive = false
    return config
  }

  static createCustom(name: string, description: string, createdBy: string): MenuConfiguration {
    const config = new MenuConfiguration()
    config.name = name
    config.description = description
    config.isSystem = false
    config.isActive = false
    config.createdBy = createdBy
    return config
  }

  canBeDeleted(): boolean {
    return !this.isSystem
  }

  canBeModified(): boolean {
    return !this.isSystem
  }
}
