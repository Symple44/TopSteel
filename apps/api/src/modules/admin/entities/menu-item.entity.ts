import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm'
import { MenuConfiguration } from './menu-configuration.entity'
import { MenuItemPermission } from './menu-item-permission.entity'
import { MenuItemRole } from './menu-item-role.entity'

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  configId!: string

  @Column({ type: 'uuid', nullable: true })
  @Index()
  parentId?: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  titleKey?: string // Clé pour l'internationalisation

  @Column({ type: 'varchar', length: 500, nullable: true })
  href?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string // Nom de l'icône Lucide

  @Column({ type: 'varchar', length: 100, nullable: true })
  gradient?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  badge?: string

  @Column({ type: 'integer', default: 0 })
  @Index()
  orderIndex!: number

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  moduleId?: string // ID du module système associé

  @Column({ type: 'varchar', length: 50, nullable: true })
  target?: string // _blank, _self, etc.

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  // Relations
  @ManyToOne(() => MenuConfiguration, config => config.items)
  @JoinColumn({ name: 'configId' })
  configuration!: MenuConfiguration

  @ManyToOne(() => MenuItem, item => item.children)
  @JoinColumn({ name: 'parentId' })
  parent?: MenuItem

  @OneToMany(() => MenuItem, item => item.parent)
  children!: MenuItem[]

  @OneToMany(() => MenuItemPermission, permission => permission.menuItem)
  permissions!: MenuItemPermission[]

  @OneToMany(() => MenuItemRole, role => role.menuItem)
  roles!: MenuItemRole[]

  // Méthodes utilitaires
  static create(
    configId: string,
    title: string,
    href?: string,
    icon?: string,
    parentId?: string
  ): MenuItem {
    const item = new MenuItem()
    item.configId = configId
    item.title = title
    item.href = href
    item.icon = icon
    item.parentId = parentId
    item.isVisible = true
    item.orderIndex = 0
    return item
  }

  hasChildren(): boolean {
    return this.children && this.children.length > 0
  }

  isRoot(): boolean {
    return !this.parentId
  }

  getDepth(): number {
    let depth = 0
    let current = this.parent
    while (current) {
      depth++
      current = current.parent
    }
    return depth
  }
}