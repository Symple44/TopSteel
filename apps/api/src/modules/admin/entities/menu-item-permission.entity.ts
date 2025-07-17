import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { MenuItem } from './menu-item.entity'

@Entity('menu_item_permissions')
@Index(['menuItemId', 'permissionId'], { unique: true })
export class MenuItemPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  menuItemId!: string

  @Column({ type: 'varchar', length: 255 })
  @Index()
  permissionId!: string

  @Column({ type: 'boolean', default: true })
  isRequired!: boolean

  @CreateDateColumn()
  createdAt!: Date

  // Relations
  @ManyToOne(() => MenuItem, menuItem => menuItem.permissions)
  @JoinColumn({ name: 'menuItemId' })
  menuItem!: MenuItem

  // Méthodes utilitaires
  static create(menuItemId: string, permissionId: string, isRequired: boolean = true): MenuItemPermission {
    const permission = new MenuItemPermission()
    permission.menuItemId = menuItemId
    permission.permissionId = permissionId
    permission.isRequired = isRequired
    return permission
  }
}