// fournisseur.entity.ts - Version corrigée
import { Column, Entity, Index } from 'typeorm';
import { BaseAuditEntity } from '../../../common/base/base.entity';

@Entity('fournisseurs')
@Index(['createdAt'])
@Index(['updatedAt'])
export class Fournisseur extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  nom!: string;

  @Column({ unique: true })
  @Index()
  email!: string;

  @Column({ length: 20, nullable: true })
  telephone?: string;

  @Column({ type: 'text', nullable: true })
  adresse?: string;

  @Column({ length: 14, nullable: true })
  siret?: string;

  @Column({ default: true })
  @Index()
  actif!: boolean;
}


