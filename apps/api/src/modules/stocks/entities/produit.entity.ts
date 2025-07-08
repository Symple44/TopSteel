import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('produits')
export class Produit {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  nom!: string

  @Column()
  reference!: string

  @Column('decimal', { precision: 10, scale: 2 })
  prix!: number

  @Column({ nullable: true })
  fournisseurPrincipal?: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
