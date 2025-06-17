// apps/api/src/modules/projets/entities/projet.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Client } from "../../clients/entities/client.entity";
import { Devis } from "../../devis/entities/devis.entity";
import { Document } from "../../documents/entities/document.entity";
import { OrdreFabrication } from "../../production/entities/ordre-fabrication.entity";
import { User } from "../../users/entities/user.entity";

export enum ProjetStatut {
  BROUILLON = "BROUILLON",
  DEVIS = "DEVIS",
  ACCEPTE = "ACCEPTE",
  EN_COURS = "EN_COURS",
  TERMINE = "TERMINE",
  ANNULE = "ANNULE",
}

export enum ProjetType {
  PORTAIL = "PORTAIL",
  CLOTURE = "CLOTURE",
  ESCALIER = "ESCALIER",
  RAMPE = "RAMPE",
  VERRIERE = "VERRIERE",
  STRUCTURE = "STRUCTURE",
  AUTRE = "AUTRE",
}

export enum ProjetPriorite {
  BASSE = "BASSE",
  NORMALE = "NORMALE",
  HAUTE = "HAUTE",
  URGENTE = "URGENTE",
}

@Entity("projets")
export class Projet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  description: string;

  @Column({
    type: "enum",
    enum: ProjetStatut,
    default: ProjetStatut.BROUILLON,
  })
  statut: ProjetStatut;

  @Column({
    type: "enum",
    enum: ProjetType,
  })
  type: ProjetType;

  @Column({
    type: "enum",
    enum: ProjetPriorite,
    default: ProjetPriorite.NORMALE,
  })
  priorite: ProjetPriorite;

  @Column({ type: "date", nullable: true })
  dateDebut: Date;

  @Column({ type: "date", nullable: true })
  dateFin: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  montantHT: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  montantTTC: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 20 })
  tauxTVA: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  avancement: number;

  @Column({ type: "jsonb", nullable: true })
  adresseChantier: {
    rue: string;
    codePostal: string;
    ville: string;
    complement?: string;
  };

  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => Client, (client) => client.projets)
  @JoinColumn()
  client: Client;

  @Column()
  clientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  responsable: User;

  @Column({ nullable: true })
  responsableId: string;

  @OneToMany(() => Devis, (devis) => devis.projet)
  devis: Devis[];

  @OneToMany(() => OrdreFabrication, (of) => of.projet)
  ordresFabrication: OrdreFabrication[];

  @OneToMany(() => Document, (document) => document.projet)
  documents: Document[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
