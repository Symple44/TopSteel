import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { MenuItem } from './menu-item.entity'

@Entity('menu_configurations')
@Index(['name'], { unique: true })
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
  metadata?: Record<string, unknown>

  @CreateDateColumn({ name: 'createdat' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updatedat' })
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true, name: 'createdby' })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true, name: 'updatedby' })
  updatedBy?: string

  // Relations
  @OneToMany(
    () => MenuItem,
    (menuItem) => menuItem.configuration
  )
  items!: MenuItem[]

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
