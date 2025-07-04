import * as bcrypt from "bcrypt";
import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from "typeorm";
import { BaseAuditEntity } from "../../../common/base/base.entity";

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  COMMERCIAL = "COMMERCIAL",
  TECHNICIEN = "TECHNICIEN",
  OPERATEUR = "OPERATEUR",
}

@Entity("users")
@Index(["email"], { unique: true })
export class User extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  nom!: string;

  @Column({ length: 255 })
  prenom!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.OPERATEUR,
  })
  role!: UserRole;

  @Column({ default: true })
  @Index()
  actif!: boolean;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "jsonb", nullable: true, default: {} })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings?: Record<string, any>;

  @Column({ type: "jsonb", nullable: true, default: {} })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preferences?: Record<string, any>;

  @Column({ type: "timestamp", nullable: true })
  lastLogin?: Date;

  @Column({ type: "integer", default: 0 })
  failedLoginAttempts?: number;

  @Column({ type: "timestamp", nullable: true })
  lockedUntil?: Date;

  @Column({ type: "jsonb", nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  refreshToken?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith("$2b$")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
