import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Role } from './role.entity'

@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string

  @Column({ type: 'uuid', name: 'role_id' })
  @Index()
  roleId!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // Relations
  @ManyToOne(
    () => Role,
    (role) => role.userRoles
  )
  @JoinColumn({ name: 'role_id' })
  role!: Role

  // Méthodes utilitaires
  static assign(userId: string, roleId: string): UserRole {
    const userRole = new UserRole()
    userRole.userId = userId
    userRole.roleId = roleId
    return userRole
  }
}
