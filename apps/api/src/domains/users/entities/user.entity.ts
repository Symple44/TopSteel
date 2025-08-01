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

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COMMERCIAL = 'COMMERCIAL',
  TECHNICIEN = 'TECHNICIEN',
  COMPTABLE = 'COMPTABLE',
  OPERATEUR = 'OPERATEUR',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

@Entity('users')
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
  role!: UserRole

  @Column({ type: 'boolean', default: true })
  actif!: boolean

  @Column({ type: 'varchar', nullable: true })
  @Index('UQ_users_acronyme', { unique: true })
  acronyme?: string

  @Column({ type: 'timestamp', nullable: true })
  dernier_login?: Date

  @VersionColumn({ default: 1 })
  version!: number

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10)
    }
  }
}
