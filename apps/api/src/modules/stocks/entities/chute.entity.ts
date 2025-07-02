import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseAuditEntity } from "../../../common/base/base.entity";
import { Materiaux } from "../../materiaux/entities/materiaux.entity";

export enum ChuteQualite {
  EXCELLENTE = "EXCELLENTE",
  BONNE = "BONNE",
  CORRECTE = "CORRECTE",
  MEDIOCRE = "MEDIOCRE"
}

export enum ChuteStatut {
  DISPONIBLE = "DISPONIBLE",
  RESERVEE = "RESERVEE",
  UTILISEE = "UTILISEE",
  REBUT = "REBUT"
}

export enum OrigineType {
  PRODUCTION = "PRODUCTION",
  COMMANDE = "COMMANDE",
  CHANTIER = "CHANTIER"
}

@Entity("chutes")
export class Chute extends BaseAuditEntity {
  @Column()
  materiauId!: string;

  @ManyToOne(() => Materiaux)
  @JoinColumn({ name: "materiauId" })
  materiau!: Materiaux;

  @Column({ length: 100 })
  reference!: string;

  @Column("decimal", { precision: 8, scale: 2, nullable: true })
  longueur?: number;

  @Column("decimal", { precision: 8, scale: 2, nullable: true })
  largeur?: number;

  @Column("decimal", { precision: 8, scale: 2, nullable: true })
  epaisseur?: number;

  @Column("decimal", { precision: 8, scale: 2, nullable: true })
  diametre?: number;

  @Column("decimal", { precision: 8, scale: 2, nullable: true })
  poids?: number;

  @Column({
    type: "enum",
    enum: ChuteQualite,
    default: ChuteQualite.BONNE
  })
  qualite!: ChuteQualite;

  @Column({ length: 100, nullable: true })
  emplacement?: string;

  @Column({
    type: "enum",
    enum: OrigineType,
    nullable: true
  })
  origineType?: OrigineType;

  @Column({ length: 100, nullable: true })
  origineReference?: string;

  @Column("decimal", { precision: 8, scale: 2, nullable: true })
  valeurEstimee?: number;

  @Column({
    type: "enum",
    enum: ChuteStatut,
    default: ChuteStatut.DISPONIBLE
  })
  statut!: ChuteStatut;

  @Column("text", { nullable: true })
  notes?: string;
}