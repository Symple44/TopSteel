import { Entity, Column, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/base/base.entity';

@Entity('stockss')
@Index(['createdAt'])
@Index(['updatedAt'])
export class Stocks extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  nom!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  @Index()
  actif!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}

export enum StocksStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  ARCHIVE = 'ARCHIVE'
}
