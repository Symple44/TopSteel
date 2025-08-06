import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { MenuConfiguration } from './menu-configuration.entity'
import { MenuItemPermission } from './menu-item-permission.entity'
import { MenuItemRole } from './menu-item-role.entity'

export enum MenuItemType {
  FOLDER = 'M', // Dossier - pour regrouper des éléments
  PROGRAM = 'P', // Programme - appelle un menu/module
  LINK = 'L', // Lien externe - ouvre dans nouvel onglet
  DATA_VIEW = 'D', // Vue Data - créée via Query Builder
}

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'configId' })
  @Index()
  configId!: string

  @Column({ type: 'uuid', nullable: true, name: 'parentId' })
  @Index()
  parentId?: string

  @Column({ type: 'varchar', length: 255 })
  title!: string

  // titleKey, href, icon, gradient, badge n'existent pas en base

  @Column({ type: 'integer', default: 0, name: 'orderIndex' })
  @Index()
  orderIndex!: number

  @Column({ type: 'boolean', default: true, name: 'isVisible' })
  isVisible!: boolean

  // moduleId, target n'existent pas en base

  @Column({
    type: 'varchar',
    length: 1,
    default: MenuItemType.PROGRAM,
    comment: 'Type de menu: M=Dossier, P=Programme, L=Lien, D=Vue Data',
  })
  type!: MenuItemType

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'programId',
    comment: 'Identifiant du programme pour les menus de type P',
  })
  programId?: string

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    name: 'externalUrl',
    comment: 'URL externe pour les menus de type L',
  })
  externalUrl?: string

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'queryBuilderId',
    comment: 'ID de la vue Query Builder pour les menus de type D',
  })
  queryBuilderId?: string

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'updatedAt',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt?: Date

  @Column({ type: 'uuid', nullable: true, name: 'createdBy' })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true, name: 'updatedBy' })
  updatedBy?: string

  // Propriétés virtuelles (non mappées en base)
  titleKey?: string // Clé pour l'internationalisation
  href?: string
  icon?: string // Nom de l'icône Lucide
  gradient?: string
  badge?: string
  moduleId?: string // ID du module système associé
  target?: string // _blank, _self, etc.

  // Relations
  @ManyToOne(
    () => MenuConfiguration,
    (config) => config.items
  )
  @JoinColumn({ name: 'configId' })
  configuration!: MenuConfiguration

  @ManyToOne(
    () => MenuItem,
    (item) => item.children
  )
  @JoinColumn({ name: 'parentId' })
  parent?: MenuItem

  @OneToMany(
    () => MenuItem,
    (item) => item.parent
  )
  children!: MenuItem[]

  @OneToMany(
    () => MenuItemPermission,
    (permission) => permission.menuItem
  )
  permissions!: MenuItemPermission[]

  @OneToMany(
    () => MenuItemRole,
    (role) => role.menuItem
  )
  roles!: MenuItemRole[]

  // Méthodes utilitaires
  static create(
    configId: string,
    title: string,
    type: MenuItemType = MenuItemType.PROGRAM,
    href?: string,
    icon?: string,
    parentId?: string
  ): MenuItem {
    const item = new MenuItem()
    item.configId = configId
    item.title = title
    item.type = type
    item.href = href
    item.icon = icon
    item.parentId = parentId
    item.isVisible = true
    item.orderIndex = 0
    return item
  }

  static createFolder(configId: string, title: string, icon?: string, parentId?: string): MenuItem {
    return MenuItem.create(configId, title, MenuItemType.FOLDER, undefined, icon, parentId)
  }

  static createProgram(
    configId: string,
    title: string,
    programId: string,
    icon?: string,
    parentId?: string
  ): MenuItem {
    const item = MenuItem.create(configId, title, MenuItemType.PROGRAM, undefined, icon, parentId)
    item.programId = programId
    return item
  }

  static createLink(
    configId: string,
    title: string,
    externalUrl: string,
    icon?: string,
    parentId?: string
  ): MenuItem {
    const item = MenuItem.create(configId, title, MenuItemType.LINK, undefined, icon, parentId)
    item.externalUrl = externalUrl
    item.target = '_blank'
    return item
  }

  static createDataView(
    configId: string,
    title: string,
    queryBuilderId: string,
    icon?: string,
    parentId?: string
  ): MenuItem {
    const item = MenuItem.create(configId, title, MenuItemType.DATA_VIEW, undefined, icon, parentId)
    item.queryBuilderId = queryBuilderId
    item.target = '_blank'
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

  isFolder(): boolean {
    return this.type === MenuItemType.FOLDER
  }

  isProgram(): boolean {
    return this.type === MenuItemType.PROGRAM
  }

  isLink(): boolean {
    return this.type === MenuItemType.LINK
  }

  isDataView(): boolean {
    return this.type === MenuItemType.DATA_VIEW
  }

  getUrl(): string | undefined {
    switch (this.type) {
      case MenuItemType.PROGRAM:
        return this.programId || this.href
      case MenuItemType.LINK:
        return this.externalUrl
      case MenuItemType.DATA_VIEW:
        return this.queryBuilderId ? `/query-builder/${this.queryBuilderId}/view` : undefined
      default:
        return undefined
    }
  }
}
