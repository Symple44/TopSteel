import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseAuditEntity } from "../../../common/base/base.entity";
import { User } from "../../users/entities/user.entity";
import { OrdreFabrication } from "./ordre-fabrication.entity";

export enum OperationStatut {
  ATTENTE = "attente",
  EN_COURS = "en_cours",
  TERMINE = "termine"
}

@Entity("operations")
export class Operation extends BaseAuditEntity {
  @Column()
  ordreId!: string;

  @ManyToOne(() => OrdreFabrication, ordre => ordre.operations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ordreId" })
  ordre!: OrdreFabrication;

  @Column({ length: 255 })
  nom!: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column({ type: "integer" })
  ordreExecution!: number;

  @Column({
    type: "enum",
    enum: OperationStatut,
    default: OperationStatut.ATTENTE
  })
  statut!: OperationStatut;

  @Column({ type: "integer", nullable: true })
  tempsEstime?: number;

  @Column({ type: "integer", nullable: true })
  tempsReel?: number;

  @Column({ nullable: true })
  technicienId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "technicienId" })
  technicien?: User;

  @Column({ nullable: true })
  machineId?: string;

  @Column({ type: "timestamp", nullable: true })
  dateDebut?: Date;

  @Column({ type: "timestamp", nullable: true })
  dateFin?: Date;
}