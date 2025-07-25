import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { MenuItem } from './menu-item.entity'

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