import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm'
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

  @Column({ type: 'boolean', default: false })
  @Index()
  isActive!: boolean

  @Column({ type: 'boolean', default: false })
  @Index()
  isSystem!: boolean

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  // Relations
  @OneToMany(() => MenuItem, menuItem => menuItem.configuration)
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