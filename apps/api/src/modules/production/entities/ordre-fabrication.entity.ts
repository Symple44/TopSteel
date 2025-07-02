import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseAuditEntity } from "../../../common/base/base.entity";
import { Projet } from "../../projets/entities/projet.entity";
import { User } from "../../users/entities/user.entity";
import { Operation } from "./operation.entity";

export enum OrdreStatut {
  PLANIFIE = "PLANIFIE",
  EN_COURS = "EN_COURS",
  PAUSE = "PAUSE",
  TERMINE = "TERMINE",
  ANNULE = "ANNULE"
}

export enum OrdrePriorite {
  BASSE = "BASSE",
  NORMALE = "NORMALE",
  HAUTE = "HAUTE",
  URGENTE = "URGENTE"
}

@Entity("ordre_fabrication")
export class OrdreFabrication extends BaseAuditEntity {
  @Column({ unique: true, length: 50 })
  reference!: string;

  @Column()
  projetId!: string;

  @ManyToOne(() => Projet)
  @JoinColumn({ name: "projetId" })
  projet!: Projet;

  @Column({
    type: "enum",
    enum: OrdreStatut,
    default: OrdreStatut.PLANIFIE
  })
  statut!: OrdreStatut;

  @Column({
    type: "enum",
    enum: OrdrePriorite,
    default: OrdrePriorite.NORMALE
  })
  priorite!: OrdrePriorite;

  @Column({ type: "date", nullable: true })
  dateDebut?: Date;

  @Column({ type: "date", nullable: true })
  dateFin?: Date;

  @Column({ type: "date", nullable: true })
  dateFinPrevue?: Date;

  @Column({ type: "integer", default: 0 })
  avancement!: number;

  @Column({ nullable: true })
  technicienId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "technicienId" })
  technicien?: User;

  @Column({ nullable: true })
  machineId?: string;

  @Column({ type: "integer", nullable: true })
  tempsEstime?: number; // en minutes

  @Column({ type: "integer", nullable: true })
  tempsReel?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  coutEstime?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  coutReel?: number;

  @Column("text", { nullable: true })
  notes?: string;

  @OneToMany(() => Operation, operation => operation.ordre, { cascade: true })
  operations!: Operation[];
}