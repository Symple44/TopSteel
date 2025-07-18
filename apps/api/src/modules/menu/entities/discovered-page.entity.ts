import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('discovered_pages')
@Index(['pageId'], { unique: true })
export class DiscoveredPage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('varchar', { name: 'page_id', unique: true })
  pageId: string

  @Column('varchar', { name: 'title' })
  title: string

  @Column('varchar', { name: 'href' })
  href: string

  @Column('text', { name: 'description', nullable: true })
  description?: string

  @Column('varchar', { name: 'icon', nullable: true })
  icon?: string

  @Column('varchar', { name: 'category' })
  category: string

  @Column('varchar', { name: 'subcategory', nullable: true })
  subcategory?: string

  @Column('text', { name: 'required_permissions', nullable: true })
  requiredPermissions?: string // Stocké comme chaîne séparée par des virgules

  @Column('text', { name: 'required_roles', nullable: true })
  requiredRoles?: string // Stocké comme chaîne séparée par des virgules

  @Column('varchar', { name: 'module_id', nullable: true })
  moduleId?: string

  @Column('boolean', { name: 'is_enabled', default: true })
  isEnabled: boolean

  @Column('boolean', { name: 'is_visible', default: true })
  isVisible: boolean

  @Column('varchar', { name: 'default_access_level', default: 'ADMIN' })
  defaultAccessLevel: string

  @Column('integer', { name: 'default_order', default: 0 })
  defaultOrder: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}