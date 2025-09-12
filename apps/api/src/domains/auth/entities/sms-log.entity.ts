import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Entité pour stocker les logs SMS
 */
@Entity('sms_logs')
@Index(['phoneNumber', 'createdAt'])
@Index(['messageType', 'status'])
export class SMSLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({
    type: 'varchar',
    length: 20,
  })
  phoneNumber!: string

  @Column('text')
  message!: string

  @Column({
    type: 'varchar',
    length: 50,
    default: 'info',
  })
  messageType!: string

  @Column({
    type: 'varchar',
    length: 50,
  })
  provider!: string

  @Column({
    type: 'varchar',
    length: 50,
  })
  status!: string

  @Column({
    type: 'varchar',
    nullable: true,
  })
  messageId?: string

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  cost?: number

  @Column({
    type: 'int',
    default: 1,
  })
  segmentCount!: number

  @Column({
    type: 'text',
    nullable: true,
  })
  error?: string

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date

  @Column({
    type: 'varchar',
    nullable: true,
  })
  userId?: string

  @Column({
    type: 'varchar',
    nullable: true,
  })
  societeId?: string
}
