import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('notifications')
@Index(['userId'])
@Index(['projetId'])
@Index(['type'])
@Index(['createdAt'])
export class Notifications {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ enum: ['info', 'success', 'warning', 'error', 'projet_update', 'stock_alert', 'task_assigned'] })
  type!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column('jsonb', { nullable: true })
  data?: any;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  projetId?: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}