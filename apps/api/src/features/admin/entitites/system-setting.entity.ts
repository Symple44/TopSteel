import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseAuditEntity } from '../../../core/common/base/base.entity'
import { User } from '../../../domains/users/entities/user.entity'

@Entity('system_settings')
export class SystemSetting extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 50 })
  category!: string

  @Column({ type: 'varchar', length: 100 })
  key!: string

  @Column('jsonb')
  value!: unknown

  @Column('text', { nullable: true })
  description?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser?: User
}
