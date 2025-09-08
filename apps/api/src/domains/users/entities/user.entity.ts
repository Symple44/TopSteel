import * as bcrypt from 'bcrypt'
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm'
// Import du nouveau système de rôles unifié
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'

// Alias pour compatibilité
export const UserRole = GlobalUserRole
export type UserRole = GlobalUserRole

@Entity('users')
@Index(['role', 'actif', 'createdAt']) // Composite index for filtering by role and status
@Index(['dernier_login']) // For last login queries
@Index(['createdAt']) // For chronological queries
@Index(['updatedAt']) // For recent changes queries
@Index(['deletedAt']) // For soft delete queries
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', unique: true })
  @Index('users_email_unique')
  email!: string

  @Column({ type: 'varchar' })
  password!: string

  @Column({ type: 'varchar', nullable: true })
  nom?: string

  @Column({ type: 'varchar', nullable: true })
  prenom?: string

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.OPERATEUR,
  })
  @Index() // Index on role for permission queries
  role!: UserRole

  @Column({ type: 'boolean', default: true })
  @Index() // Index on actif for filtering active users
  actif!: boolean

  @Column({ type: 'varchar', nullable: true })
  @Index('UQ_users_acronyme', { unique: true })
  acronyme?: string

  @Column({ type: 'timestamp', nullable: true })
  @Index() // Index for last login analytics
  dernier_login?: Date

  @VersionColumn({ default: 1 })
  version!: number

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date

  @Column({ type: 'varchar', nullable: true })
  @Index({ where: 'refreshToken IS NOT NULL' }) // Partial index for active tokens
  refreshToken?: string

  @Column({ type: 'jsonb', nullable: true })
  @Index() // GIN index for JSONB metadata queries (PostgreSQL)
  metadata?: Record<string, unknown>

  // Note: societeId removed - relation with Societe is handled via societe_users join table

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10
      this.password = await bcrypt.hash(this.password, saltRounds)
    }
  }
}
