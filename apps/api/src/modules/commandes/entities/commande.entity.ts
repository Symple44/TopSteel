import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('commandes')
export class Commande {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  numero!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  montant!: number;

  @Column({ nullable: true })
  fournisseur?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
