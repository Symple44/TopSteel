import { Column, Entity, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/base/base.entity';

@Entity('clients')
export class Clients extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  nom!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  @Index()
  actif!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 20, nullable: true })
  telephone?: string;

  @Column({ type: 'text', nullable: true })
  adresse?: string;
}

export enum ClientsStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  ARCHIVE = 'ARCHIVE'
}
