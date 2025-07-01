import { Entity, Column, Index } from "typeorm";
import { BaseAuditEntity } from "../../../common/base/base.entity";

@Entity("plannings")
export class Planning extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  nom!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ default: true })
  @Index()
  actif!: boolean;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown>;
}

export enum PlanningStatut {
  ACTIF = "ACTIF",
  INACTIF = "INACTIF",
  ARCHIVE = "ARCHIVE",
}
