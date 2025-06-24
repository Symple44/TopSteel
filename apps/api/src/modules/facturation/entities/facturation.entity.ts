import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('facturation')
export class Facturation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
