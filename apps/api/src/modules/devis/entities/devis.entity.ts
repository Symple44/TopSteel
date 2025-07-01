import { Column, Entity, Index } from "typeorm";
import { BaseAuditEntity } from "../../../common/base/base.entity";

@Entity("devis")
export class Devis extends BaseAuditEntity {
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

export enum DevisStatut {
  ACTIF = "ACTIF",
  INACTIF = "INACTIF",
  ARCHIVE = "ARCHIVE",
}
