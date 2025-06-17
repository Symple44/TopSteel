// apps/api/src/modules/fournisseurs/entities/fournisseur.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Commande } from '../../commandes/entities/commande.entity';
import { Produit } from '../../stocks/entities/produit.entity';

@Entity('fournisseurs')
export class Fournisseur {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nom: string;

  @Column({ unique: true })
  siret: string;

  @Column({ nullable: true })
  tvaIntra: string;

  @Column()
  email: string;

  @Column()
  telephone: string;

  @Column({ type: 'jsonb' })
  adresse: {
    rue: string;
    codePostal: string;
    ville: string;
    pays: string;
    complement?: string;
  };

  @Column({ nullable: true })
  siteWeb: string;

  @Column({ type: 'jsonb', nullable: true })
  contacts: Array<{
    nom: string;
    prenom: string;
    fonction: string;
    telephone: string;
    email: string;
  }>;

  @Column({ default: 30 })
  delaiPaiement: number; // en jours

  @Column({ nullable: true })
  conditionsPaiement: string;

  @Column({ default: 7 })
  delaiLivraison: number; // en jours

  @Column({ default: 0 })
  franco: number; // montant minimum pour franco de port

  @Column({ type: 'simple-array', nullable: true })
  categories: string[]; // catégories de produits

  @Column({ default: true })
  actif: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Commande, commande => commande.fournisseur)
  commandes: Commande[];

  @OneToMany(() => Produit, produit => produit.fournisseurPrincipal)
  produits: Produit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}