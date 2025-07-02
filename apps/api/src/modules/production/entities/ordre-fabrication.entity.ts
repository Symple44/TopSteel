import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Projet } from '../../projets/entities/projet.entity';
import { Operation } from './operation.entity';

// ✅ Export des enums pour corriger les erreurs d'import
export enum OrdreFabricationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  PAUSE = 'PAUSE'
}

export enum PrioriteProduction {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

@Entity("ordre_fabrication")
export class OrdreFabrication {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  numero!: string;

  @Column({
    type: 'enum',
    enum: OrdreFabricationStatut,
    default: OrdreFabricationStatut.EN_ATTENTE,
  })
  statut!: OrdreFabricationStatut;

  @Column({ name: 'projet_id', nullable: true })
  projet?: number;

  @ManyToOne(() => Projet, { nullable: true })
  @JoinColumn({ name: 'projet_id' })
  projetEntity?: Projet;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PrioriteProduction,
    default: PrioriteProduction.NORMALE,
  })
  priorite!: PrioriteProduction;

  @Column({ type: 'timestamp', name: 'date_debut_prevue', nullable: true })
  dateDebutPrevue?: Date;

  @Column({ type: 'timestamp', name: 'date_fin_prevue', nullable: true })
  dateFinPrevue?: Date;

  @Column({ type: 'timestamp', name: 'date_debut_reelle', nullable: true })
  dateDebutReelle?: Date;

  @Column({ type: 'timestamp', name: 'date_fin_reelle', nullable: true })
  dateFinReelle?: Date;

  @Column({ type: 'int', default: 0 })
  avancement!: number;

  @Column({ name: 'responsable_id', nullable: true })
  responsableId?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => Operation, operation => operation.ordre, { cascade: true })
  operations!: Operation[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
