import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { Devis } from '../../devis/entities/devis.entity';

export enum ProjetStatut {
  BROUILLON = 'brouillon',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule'
}

@Entity('projets')
export class Projet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ProjetStatut,
    default: ProjetStatut.BROUILLON
  })
  statut: ProjetStatut;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  montantTotal?: number;

  @Column({ nullable: true })
  dateDebut?: Date;

  @Column({ nullable: true })
  dateFin?: Date;

  @Column({ nullable: true })
  clientId?: number;

  @Column({ nullable: true })
  responsableId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client?: Client;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsableId' })
  responsable?: User;
}
