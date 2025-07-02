import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseAuditEntity } from "../../../common/base/base.entity";
import { User } from "../../users/entities/user.entity";

@Entity("system_settings")
export class SystemSetting extends BaseAuditEntity {
  @Column({ length: 50 })
  category!: string;

  @Column({ length: 100 })
  key!: string;

  @Column("jsonb")
  value!: unknown;

  @Column("text", { nullable: true })
  description?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "updatedBy" })
  updatedByUser?: User;
}