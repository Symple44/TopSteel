import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fournisseurs')
export class Fournisseur {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nom!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  telephone?: string;

  @Column({ nullable: true })
  adresse?: string;

  @Column({ nullable: true })
  siret?: string;

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
