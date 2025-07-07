import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

export enum OrdreFabricationStatut {
  EN_ATTENTE = "EN_ATTENTE",
  EN_COURS = "EN_COURS",
  TERMINE = "TERMINE",
  ANNULE = "ANNULE",
}

export enum PrioriteProduction {
  FAIBLE = "FAIBLE",
  NORMALE = "NORMALE",
  ELEVEE = "ELEVEE",
  URGENTE = "URGENTE",
}

@Entity("ordres_fabrication")
export class OrdreFabrication {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  numero!: string;

  @Column({
    type: "enum",
    enum: OrdreFabricationStatut,
    default: OrdreFabricationStatut.EN_ATTENTE,
  })
  statut!: OrdreFabricationStatut;

  @Column({ nullable: true })
  projet?: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: PrioriteProduction,
    default: PrioriteProduction.NORMALE,
  })
  priorite!: PrioriteProduction;

  @Column({ type: "timestamp", nullable: true })
  dateDebut?: Date;

  @Column({ type: "timestamp", nullable: true })
  dateFin?: Date;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relation avec les opérations
  @OneToMany("Operation", "ordreFabrication", { cascade: true })
  operations?: any[];

  // Relation virtuelle pour le projet (si vous avez une entité Projet)
  projetEntity?: any;
}
