import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { MenuItem } from './menu-item.entity'

@Entity('menu_item_roles')
@Index(['menuItemId', 'roleId'], { unique: true })
export class MenuItemRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'menuItemId' })
  @Index()
  menuItemId!: string

  @Column({ type: 'varchar', length: 255, name: 'roleId' })
  @Index()
  roleId!: string

  // isRequired n'existe pas en base, propriété virtuelle
  isRequired?: boolean

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date

  // Relations
  @ManyToOne(
    () => MenuItem,
    (menuItem) => menuItem.roles
  )
  @JoinColumn({ name: 'menuItemId' })
  menuItem!: MenuItem

  // Méthodes utilitaires
  static create(menuItemId: string, roleId: string, isRequired: boolean = true): MenuItemRole {
    const role = new MenuItemRole()
    role.menuItemId = menuItemId
    role.roleId = roleId
    role.isRequired = isRequired
    return role
  }
}
