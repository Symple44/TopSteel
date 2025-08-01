import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date

  @VersionColumn({ default: 1 })
  version!: number
}

export abstract class BaseAuditEntity extends BaseEntity {
  @Column({ name: 'created_by_id', nullable: true, type: 'uuid' })
  createdById?: string

  @Column({ name: 'updated_by_id', nullable: true, type: 'uuid' })
  updatedById?: string
}
