import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Group } from './group.entity'

@Entity('user_groups')
@Index(['userId', 'groupId'], { unique: true })
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  userId!: string

  @Column({ type: 'uuid' })
  @Index()
  groupId!: string

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
  @ManyToOne(
    () => Group,
    (group) => group.userGroups
  )
  @JoinColumn({ name: 'groupId' })
  group!: Group

  // Méthodes utilitaires
  static assign(userId: string, groupId: string, assignedBy?: string, expiresAt?: Date): UserGroup {
    const userGroup = new UserGroup()
    userGroup.userId = userId
    userGroup.groupId = groupId
    userGroup.assignedBy = assignedBy
    userGroup.expiresAt = expiresAt
    userGroup.isActive = true
    return userGroup
  }

  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired()
  }
}
