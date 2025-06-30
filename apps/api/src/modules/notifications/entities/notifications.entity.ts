// apps/api/src/modules/notifications/entities/notifications.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// Enum TypeScript propre
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  PROJET_UPDATE = 'projet_update',
  STOCK_ALERT = 'stock_alert',
  TASK_ASSIGNED = 'task_assigned',
}

@Entity('notifications')
@Index(['userId'])
@Index(['projetId'])
@Index(['type'])
@Index(['createdAt'])
export class Notification { // ← Singulier pour la classe
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: NotificationType, // ← Enum TypeScript correct
  })
  type!: NotificationType;

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