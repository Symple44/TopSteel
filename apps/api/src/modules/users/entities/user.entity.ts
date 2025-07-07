import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import * as bcrypt from "bcrypt";

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  COMMERCIAL = "COMMERCIAL",
  TECHNICIEN = "TECHNICIEN",
  OPERATEUR = "OPERATEUR",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  nom!: string;

  @Column()
  prenom!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.OPERATEUR,
  })
  role!: UserRole;

  @Column({ default: true })
  actif!: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
