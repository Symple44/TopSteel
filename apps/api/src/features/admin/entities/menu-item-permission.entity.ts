import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
// import { MenuItem } from './menu-item.entity';

// Interface to avoid circular dependency
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
}

@Entity('menu_item_permissions')
@Index(['menuItemId', 'permissionId'], { unique: true })
export class MenuItemPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'menuItemId' })
  @Index()
  menuItemId!: string

  @Column({ type: 'varchar', length: 255, name: 'permissionId' })
  @Index()
  permissionId!: string

  // isRequired n'existe pas en base, propriété virtuelle
  isRequired?: boolean

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date

  // Relations
  @ManyToOne('MenuItem', 'permissions', { lazy: true })
  @JoinColumn({ name: 'menuItemId' })
  menuItem!: MenuItemData

  // Méthodes utilitaires
  static create(
    menuItemId: string,
    permissionId: string,
    isRequired: boolean = true
  ): MenuItemPermission {
    const permission = new MenuItemPermission()
    permission.menuItemId = menuItemId
    permission.permissionId = permissionId
    permission.isRequired = isRequired
    return permission
  }
}
