import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Role } from './role.entity'

@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  userId!: string

  @Column({ type: 'uuid' })
  @Index()
  roleId!: string

  @Column({ type: 'uuid', nullable: true })
  assignedBy?: string

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relations
  @ManyToOne(() => Role, role => role.userRoles)
  @JoinColumn({ name: 'roleId' })
  role!: Role

  // Méthodes utilitaires
  static assign(
    userId: string,
    roleId: string,
    assignedBy?: string,
    expiresAt?: Date
  ): UserRole {
    const userRole = new UserRole()
    userRole.userId = userId
    userRole.roleId = roleId
    userRole.assignedBy = assignedBy
    userRole.expiresAt = expiresAt
    userRole.isActive = true
    return userRole
  }

  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired()
  }
}