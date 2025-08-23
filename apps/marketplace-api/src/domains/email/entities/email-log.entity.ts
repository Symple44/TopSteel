import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm'

@Entity('email_logs')
@Index(['recipient', 'type'])
@Index(['tokenHash'])
@Index(['expiresAt'])
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  recipient: string

  @Column()
  type: string

  @Column({ nullable: true })
  tokenHash?: string

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>

  @CreateDateColumn()
  sentAt: Date

  @Column({ type: 'timestamp', nullable: true })
  openedAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  clickedAt?: Date

  @Column({ default: false })
  bounced: boolean

  @Column({ nullable: true })
  bouncedReason?: string
}